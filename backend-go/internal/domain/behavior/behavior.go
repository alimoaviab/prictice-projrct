// Package behavior implements /api/behavior endpoints. Mirrors
// old-app/shared/services/behavior.service.ts.
package behavior

import (
	"encoding/json"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

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
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "behavior", auth.ActionView); err != nil {
			return nil, err
		}
		studentID := q.Get("student_id")
		classID := q.Get("class_id")
		teacherID := q.Get("teacher_id")
		statusQ := q.Get("status")
		severity := q.Get("severity")
		category := q.Get("category")

		h.Store.RLock()
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
	}))
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
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, b := range h.Store.Behaviors {
			if b.ID == id && b.SchoolID == ctx.SchoolID {
				before := *b
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
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "behavior", EntityID: id, Before: before, After: *b,
				})
				return h.hydrate([]*store.Behavior{b})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Behavior record not found.", 404, nil)
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
				before := *b
				h.Store.Behaviors = append(h.Store.Behaviors[:i], h.Store.Behaviors[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "user", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Behavior record not found.", 404, nil)
	}))
}
