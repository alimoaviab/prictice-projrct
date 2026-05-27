// Package behavior implements /api/behavior endpoints. Mirrors
// old-app/shared/services/behavior.service.ts.
package behavior

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/access"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

const behaviorListCacheTTL = 60 * time.Second

type Handler struct {
	Store   *store.MemStore
	Cache   *cache.Client
	Persist func(table string, doc any)
}

func New(s *store.MemStore) *Handler {
	return &Handler{Store: s, Persist: func(string, any) {}}
}

// NewWithCache attaches a Redis client. Pass nil to opt out.
func NewWithCache(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Cache: c, Persist: save}
}

// listCacheKey hashes (school, role, query) — role matters because
// parents/students see only critical reports while admin/teacher see
// everything.
func listCacheKey(schoolID, role, query string) string {
	src := fmt.Sprintf("%s|%s|%s", schoolID, role, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("behavior:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("behavior:list:%s:*", schoolID))
}

func (h *Handler) hydrate(rows []*store.Behavior) []map[string]any {
	studentByID := map[string]*store.Student{}
	classByID := map[string]*store.Class{}
	teacherByID := map[string]*store.Teacher{}
	h.Store.RLock()
	for _, s := range h.Store.Students {
		studentByID[s.ID] = s
	}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	for _, t := range h.Store.Teachers {
		teacherByID[t.ID] = t
	}
	h.Store.RUnlock()

	out := make([]map[string]any, 0, len(rows))
	for _, b := range rows {
		stu := studentByID[b.StudentID]
		cls := classByID[b.ClassID]
		tch := teacherByID[b.TeacherID]
		studentName := ""
		if stu != nil {
			studentName = stu.FirstName + " " + stu.LastName
		}
		className := ""
		if cls != nil {
			className = cls.Name
		}
		teacherName := ""
		if tch != nil {
			teacherName = tch.FirstName + " " + tch.LastName
		}
		out = append(out, map[string]any{
			"_id":             b.ID,
			"id":              b.ID,
			"school_id":       b.SchoolID,
			"student_id":      b.StudentID,
			"student_name":    studentName,
			"class_id":        b.ClassID,
			"class_name":      className,
			"teacher_id":      b.TeacherID,
			"teacher_name":    teacherName,
			"category":        b.Category,
			"incident_type":   b.IncidentType,
			"description":     b.Description,
			"severity":        b.Severity,
			"action_taken":    b.ActionTaken,
			"status":          b.Status,
			"warning_count":   b.WarningCount,
			"parent_notified": b.ParentNotified,
			"notes":           b.Notes,
			"attachments":     b.Attachments,
			"created_at":      b.CreatedAt,
			"updated_at":      b.UpdatedAt,
		})
	}
	return out
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	if err := auth.AssertPermission(ctx, "behavior", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, q.Encode())
	cacheable := access.IsPrivileged(ctx)
	if cacheable && h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		studentID := q.Get("student_id")
		classID := q.Get("class_id")
		teacherID := q.Get("teacher_id")
		statusQ := q.Get("status")
		severity := q.Get("severity")
		category := q.Get("category")

		h.Store.RLock()
		teacherClassIDs := map[string]bool{}
		parentStudentIDs := map[string]bool{}
		var selfStudent *store.Student
		switch ctx.Role {
		case "teacher":
			teacherClassIDs = access.TeacherClassIDsLocked(h.Store, ctx)
		case "student":
			selfStudent = access.StudentProfileLocked(h.Store, ctx)
		case "parent":
			parentStudentIDs = access.ParentStudentIDsLocked(h.Store, ctx)
		}
		rows := make([]*store.Behavior, 0)
		for _, b := range h.Store.Behaviors {
			if b.SchoolID != ctx.SchoolID {
				continue
			}
			if studentID != "" && b.StudentID != studentID {
				continue
			}
			if classID != "" && b.ClassID != classID {
				continue
			}
			if teacherID != "" && b.TeacherID != teacherID {
				continue
			}
			if statusQ != "" && statusQ != "all" && b.Status != statusQ {
				continue
			}
			if severity != "" && b.Severity != severity {
				continue
			}
			if category != "" && b.Category != category {
				continue
			}
			if ctx.Role == "teacher" && !teacherClassIDs[b.ClassID] {
				continue
			}
			if ctx.Role == "student" && (selfStudent == nil || b.StudentID != selfStudent.ID) {
				continue
			}
			if ctx.Role == "parent" && !parentStudentIDs[b.StudentID] {
				continue
			}

			// Visibility rules for parents/students
			if ctx.Role == "parent" || ctx.Role == "student" {
				if b.Status == "dismissed" || b.Status == "reviewing" {
					continue
				}
				// Only show critical/major or positive achievements
				isCritical := b.Severity == "critical" || b.Severity == "major" || b.Severity == "high"
				isPositive := b.Category == "achievement" || b.Category == "positive_behavior"
				if !isCritical && !isPositive {
					continue
				}
			}

			rows = append(rows, b)
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].CreatedAt.After(rows[j].CreatedAt)
		})
		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode behaviors.", 500, nil))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if h.Cache != nil && h.Cache.Available() {
		w.Header().Set("X-Cache", "MISS")
	}
	if !result.Ok {
		status := http.StatusBadRequest
		if result.Error != nil && result.Error.Status != 0 {
			status = result.Error.Status
		}
		w.WriteHeader(status)
		_, _ = w.Write(bytes)
		return
	}
	_, _ = w.Write(bytes)

	if cacheable && h.Cache != nil && h.Cache.Available() {
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, behaviorListCacheTTL)
	}
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "behavior", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, b := range h.Store.Behaviors {
			if b.ID == id && b.SchoolID == ctx.SchoolID {
				if !access.CanAccessStudentLocked(h.Store, ctx, b.StudentID) {
					return nil, api.NewControlledError("FORBIDDEN", "Access denied.", 403, nil)
				}
				return h.hydrate([]*store.Behavior{b})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Behavior record not found.", 404, nil)
	}))
}

type createInput struct {
	StudentID      string   `json:"student_id"`
	ClassID        string   `json:"class_id"`
	Category       string   `json:"category"`
	IncidentType   string   `json:"incident_type"`
	Description    string   `json:"description"`
	Severity       string   `json:"severity"`
	ActionTaken    string   `json:"action_taken"`
	Status         string   `json:"status,omitempty"`
	WarningCount   int      `json:"warning_count,omitempty"`
	ParentNotified bool     `json:"parent_notified,omitempty"`
	Notes          string   `json:"notes,omitempty"`
	Attachments    []string `json:"attachments,omitempty"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "behavior", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.StudentID == "" || body.ClassID == "" || body.Description == "" || body.Severity == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "student_id, class_id, description and severity are required.", 400, nil)
		}

		if body.Category == "" {
			body.Category = body.IncidentType
		}
		if body.Category == "" {
			body.Category = "conduct"
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		var stu *store.Student
		for _, s := range h.Store.Students {
			if s.ID == body.StudentID && s.SchoolID == ctx.SchoolID {
				stu = s
				break
			}
		}
		if stu == nil {
			return nil, api.NewControlledError("STUDENT_NOT_FOUND", "Student not found in this school context.", 404, nil)
		}
		if stu.ClassID != body.ClassID {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id does not match the selected student.", 400, nil)
		}
		if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, body.ClassID) {
			return nil, api.NewControlledError("FORBIDDEN", "You can only create behavior records for assigned classes.", 403, nil)
		}

		teacherID := ctx.UserID
		if ctx.Role == "teacher" {
			for _, t := range h.Store.Teachers {
				if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					teacherID = t.ID
					break
				}
			}
		}

		warning := body.WarningCount
		if warning == 0 {
			warning = 1
		}
		statusV := body.Status
		if statusV == "" {
			statusV = "open"
		}
		now := time.Now()
		row := &store.Behavior{
			ID:             store.NewID("bhv"),
			SchoolID:       ctx.SchoolID,
			StudentID:      body.StudentID,
			ClassID:        body.ClassID,
			TeacherID:      teacherID,
			Category:       body.Category,
			IncidentType:   body.Category,
			Description:    body.Description,
			Severity:       body.Severity,
			ActionTaken:    body.ActionTaken,
			Status:         statusV,
			WarningCount:   warning,
			ParentNotified: body.ParentNotified,
			Notes:          body.Notes,
			Attachments:    body.Attachments,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Behaviors = append(h.Store.Behaviors, row)
		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "behavior", EntityID: row.ID, After: row,
		})
		h.Persist("behaviors", row)
		h.invalidateList(r, ctx.SchoolID)
		// Build response inline (we hold the write lock, so we cannot call
		// hydrate which would try to acquire a read lock — that deadlocks).
		studentName := stu.FirstName + " " + stu.LastName
		className := ""
		for _, c := range h.Store.Classes {
			if c.ID == row.ClassID {
				className = c.Name
				break
			}
		}
		teacherName := ""
		for _, t := range h.Store.Teachers {
			if t.ID == row.TeacherID {
				teacherName = t.FirstName + " " + t.LastName
				break
			}
		}
		return map[string]any{
			"_id":             row.ID,
			"id":              row.ID,
			"school_id":       row.SchoolID,
			"student_id":      row.StudentID,
			"student_name":    studentName,
			"class_id":        row.ClassID,
			"class_name":      className,
			"teacher_id":      row.TeacherID,
			"teacher_name":    teacherName,
			"category":        row.Category,
			"incident_type":   row.IncidentType,
			"description":     row.Description,
			"severity":        row.Severity,
			"action_taken":    row.ActionTaken,
			"status":          row.Status,
			"warning_count":   row.WarningCount,
			"parent_notified": row.ParentNotified,
			"notes":           row.Notes,
			"attachments":     row.Attachments,
			"created_at":      row.CreatedAt,
			"updated_at":      row.UpdatedAt,
		}, nil
	}))
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "behavior", auth.ActionUpdate); err != nil {
			return nil, err
		}
		var updated store.Behavior
		var before store.Behavior
		found := false
		h.Store.Lock()
		for _, b := range h.Store.Behaviors {
			if b.ID == id && b.SchoolID == ctx.SchoolID {
				if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, b.ClassID) {
					h.Store.Unlock()
					return nil, api.NewControlledError("FORBIDDEN", "You can only update behavior records for assigned classes.", 403, nil)
				}
				before = *b
				if v, ok := body["category"]; ok {
					_ = json.Unmarshal(v, &b.Category)
					b.IncidentType = b.Category
				} else if v, ok := body["incident_type"]; ok {
					_ = json.Unmarshal(v, &b.IncidentType)
					b.Category = b.IncidentType
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &b.Description)
				}
				if v, ok := body["severity"]; ok {
					_ = json.Unmarshal(v, &b.Severity)
				}
				if v, ok := body["action_taken"]; ok {
					_ = json.Unmarshal(v, &b.ActionTaken)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &b.Status)
				}
				if v, ok := body["warning_count"]; ok {
					_ = json.Unmarshal(v, &b.WarningCount)
				}
				if v, ok := body["parent_notified"]; ok {
					_ = json.Unmarshal(v, &b.ParentNotified)
				}
				if v, ok := body["notes"]; ok {
					_ = json.Unmarshal(v, &b.Notes)
				}
				if v, ok := body["attachments"]; ok {
					_ = json.Unmarshal(v, &b.Attachments)
				}
				b.UpdatedAt = time.Now()
				updated = *b
				found = true
				break
			}
		}
		h.Store.Unlock()
		if !found {
			return nil, api.NewControlledError("NOT_FOUND", "Behavior record not found.", 404, nil)
		}
		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "behavior", EntityID: id, Before: before, After: updated,
		})
		h.Persist("behaviors", &updated)
		h.invalidateList(r, ctx.SchoolID)
		return h.hydrate([]*store.Behavior{&updated})[0], nil
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "behavior", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, b := range h.Store.Behaviors {
			if b.ID == id && b.SchoolID == ctx.SchoolID {
				if ctx.Role == "teacher" && !access.CanAccessClassLocked(h.Store, ctx, b.ClassID) {
					return nil, api.NewControlledError("FORBIDDEN", "You can only delete behavior records for assigned classes.", 403, nil)
				}
				before := *b
				h.Store.Behaviors = append(h.Store.Behaviors[:i], h.Store.Behaviors[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "behavior", EntityID: id, Before: before,
				})
				h.Persist("behaviors:delete", before.ID)
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Behavior record not found.", 404, nil)
	}))
}
