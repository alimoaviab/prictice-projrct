// Package homework implements /api/homework endpoints. Mirrors
// old-app/shared/services/homework.service.ts.
package homework

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
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// homeworkListCacheTTL — short window so newly-assigned homework
// shows up quickly without forcing cross-module invalidation.
const homeworkListCacheTTL = 60 * time.Second

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Cache   *cache.Client
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

// NewWithCache attaches a Redis client. Pass nil to opt out.
func NewWithCache(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	h := New(s, save)
	h.Cache = c
	return h
}

// listCacheKey hashes filter inputs for a stable per-tenant key.
// Role + profile id are part of the key because the list is scoped
// per-role (student/teacher see different rows than admin).
func listCacheKey(schoolID, role, profileID, query string) string {
	src := fmt.Sprintf("%s|%s|%s|%s", schoolID, role, profileID, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("homework:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("homework:list:%s:*", schoolID))
}

func (h *Handler) hydrate(rows []*store.Homework) []map[string]any {
	classByID := map[string]*store.Class{}
	teacherByID := map[string]*store.Teacher{}
	subjectByID := map[string]*store.Subject{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	for _, t := range h.Store.Teachers {
		teacherByID[t.ID] = t
	}
	for _, s := range h.Store.Subjects {
		subjectByID[s.ID] = s
	}

	out := make([]map[string]any, 0, len(rows))
	for _, hw := range rows {
		cls := classByID[hw.ClassID]
		tch := teacherByID[hw.TeacherID]
		sub := subjectByID[hw.SubjectID]
		className, teacherName, employeeNo := "", "Teacher", ""
		if cls != nil {
			className = cls.Name
		}
		if tch != nil {
			teacherName = tch.FirstName + " " + tch.LastName
			employeeNo = tch.EmployeeNo
		}
		subjectID, subjectName := hw.SubjectID, hw.Subject
		if sub != nil {
			subjectID = sub.ID
			subjectName = sub.Name
		}
		out = append(out, map[string]any{
			"_id":                 hw.ID,
			"id":                  hw.ID,
			"school_id":           hw.SchoolID,
			"academic_year_id":    hw.AcademicYearID,
			"class_id":            hw.ClassID,
			"section":             hw.Section,
			"class_name":          className,
			"teacher_id":          hw.TeacherID,
			"teacher_name":        teacherName,
			"teacher_employee_no": employeeNo,
			"subject_id":          subjectID,
			"subject_name":        subjectName,
			"subject":             subjectName,
			"title":               hw.Title,
			"instructions":        hw.Instructions,
			"due_at":              api.FormatDate(hw.DueAt),
			"status":              hw.Status,
			"submissions":         hw.Submissions,
			"attachments":         hw.Attachments,
			"visibility":          hw.Visibility,
			"created_by":          hw.CreatedBy,
			"created_by_role":     hw.CreatedByRole,
			"created_at":          hw.CreatedAt,
			"updated_at":          hw.UpdatedAt,
		})
	}
	return out
}

// List implements GET /api/homework.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	if err := auth.AssertPermission(ctx, "homework", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	// Resolve scoping profile outside the cache key so two different
	// teachers/students don't share a cache entry.
	var profileID string
	if ctx.Role == "student" {
		h.Store.RLock()
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
				profileID = s.ID
				break
			}
		}
		h.Store.RUnlock()
	} else if ctx.Role == "teacher" {
		h.Store.RLock()
		for _, t := range h.Store.Teachers {
			if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
				profileID = t.ID
				break
			}
		}
		h.Store.RUnlock()
	}

	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, profileID, q.Encode())
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		section := q.Get("section")
		statusQ := q.Get("status")
		teacherID := q.Get("teacher_id")

		h.Store.RLock()
		var studentProfile *store.Student
		var teacherProfile *store.Teacher

		if ctx.Role == "student" {
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
					studentProfile = s
					break
				}
			}
		} else if ctx.Role == "teacher" {
			for _, t := range h.Store.Teachers {
				if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					teacherProfile = t
					break
				}
			}
		}
		h.Store.RUnlock()

		// Scoping for non-admins
		if ctx.Role == "student" {
			if studentProfile == nil {
				return []any{}, nil
			}
			classID = studentProfile.ClassID
			section = studentProfile.Section
			if statusQ == "" {
				statusQ = "assigned"
			}
		} else if ctx.Role == "teacher" {
			if teacherProfile == nil {
				return []any{}, nil
			}
			// If no explicit filter, teachers see what they created or are assigned to
			if teacherID == "" && classID == "" {
				teacherID = teacherProfile.ID
			}
		}

		h.Store.RLock()
		rows := make([]*store.Homework, 0)
		for _, hw := range h.Store.Homework {
			if hw.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && hw.AcademicYearID != "" && hw.AcademicYearID != yearID {
				continue
			}
			if classID != "" && hw.ClassID != classID {
				continue
			}
			if section != "" && hw.Section != "" && hw.Section != section {
				continue
			}
			if statusQ != "" && statusQ != "all" && hw.Status != statusQ {
				continue
			}

			// Role-based visibility
			if ctx.Role == "student" {
				if hw.Status == "draft" {
					continue
				}
			} else if ctx.Role == "teacher" {
				// Teachers see homework they created OR were assigned as teacher
				if teacherID != "" && hw.TeacherID != teacherID && hw.CreatedBy != ctx.UserID {
					continue
				}
			} else if ctx.Role == "admin" {
				if teacherID != "" && hw.TeacherID != teacherID {
					continue
				}
			}

			rows = append(rows, hw)
		}
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].DueAt.Before(rows[j].DueAt)
		})

		hydrated := h.hydrate(rows)
		h.Store.RUnlock()
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode homework.", 500, nil))
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

	if h.Cache != nil && h.Cache.Available() {
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, homeworkListCacheTTL)
	}
}

// Get implements GET /api/homework/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "homework", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, hw := range h.Store.Homework {
			if hw.ID == id && hw.SchoolID == ctx.SchoolID {
				row := h.hydrate([]*store.Homework{hw})[0]
				// Student privacy: collapse `submissions` to my_submission only.
				if ctx.Role == "student" {
					var self *store.Student
					for _, s := range h.Store.Students {
						if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
							self = s
							break
						}
					}
					if self != nil {
						var mine *store.HomeworkSubmission
						for i := range hw.Submissions {
							if hw.Submissions[i].StudentID == self.ID {
								mine = &hw.Submissions[i]
								break
							}
						}
						row["my_submission"] = mine
						delete(row, "submissions")
					}
				}
				return row, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Homework not found.", 404, nil)
	}))
}

type createInput struct {
	ClassID      string   `json:"class_id"`
	Section      string   `json:"section"`
	TeacherID    string   `json:"teacher_id"`
	SubjectID    string   `json:"subject_id"`
	Title        string   `json:"title"`
	Instructions string   `json:"instructions"`
	DueAt        string   `json:"due_at"`
	Status       string   `json:"status"`
	Attachments  []string `json:"attachments"`
	Visibility   string   `json:"visibility"`
}

// Create implements POST /api/homework.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "homework", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" || body.Title == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id and title are required.", 400, nil)
		}
		dueAt, ok := api.ParseDate(body.DueAt)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid due_at date.", 400, nil)
		}
		// 23:59 same day
		dueAt = time.Date(dueAt.Year(), dueAt.Month(), dueAt.Day(), 23, 59, 0, 0, time.UTC)

		h.Store.Lock()
		
		var class *store.Class
		for _, c := range h.Store.Classes {
			if c.ID == body.ClassID && c.SchoolID == ctx.SchoolID {
				class = c
				break
			}
		}
		if class == nil {
			h.Store.Unlock()
			return nil, api.NewControlledError("NOT_FOUND", "Selected class was not found.", 404, nil)
		}

		teacherID := body.TeacherID
		if teacherID == "" && ctx.Role == "teacher" {
			for _, t := range h.Store.Teachers {
				if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					teacherID = t.ID
					break
				}
			}
		}

		var subject *store.Subject
		if body.SubjectID != "" {
			for _, s := range h.Store.Subjects {
				if (s.ID == body.SubjectID || s.Name == body.SubjectID) && s.SchoolID == ctx.SchoolID {
					subject = s
					break
				}
			}
			if subject == nil && len(body.SubjectID) >= 2 {
				newSub := &store.Subject{
					ID: store.NewID("sub"), SchoolID: ctx.SchoolID,
					Name: body.SubjectID, Status: "active", CreatedAt: time.Now(),
				}
				h.Store.Subjects = append(h.Store.Subjects, newSub)
				subject = newSub
			}
		}

		yearID := class.AcademicYearID
		if yearID == "" {
			yearID = ctx.ActiveAcademicYearID
		}

		submissions := make([]store.HomeworkSubmission, 0)
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID && s.ClassID == body.ClassID && s.Status == "active" {
				if body.Section != "" && s.Section != body.Section {
					continue
				}
				submissions = append(submissions, store.HomeworkSubmission{
					StudentID:      s.ID,
					Status:         "pending",
					AttachmentURLs: []string{},
				})
			}
		}

		now := time.Now()
		newRow := &store.Homework{
			ID:             store.NewID("hwk"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: yearID,
			ClassID:        body.ClassID,
			Section:        body.Section,
			TeacherID:      teacherID,
			Title:          body.Title,
			Instructions:   body.Instructions,
			DueAt:          dueAt,
			Status:         orDefault(body.Status, "assigned"),
			Submissions:    submissions,
			Attachments:    body.Attachments,
			Visibility:     orDefault(body.Visibility, "all"),
			CreatedBy:      ctx.UserID,
			CreatedByRole:  ctx.Role,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		if subject != nil {
			newRow.SubjectID = subject.ID
			newRow.Subject = subject.Name
		}
		h.Store.Homework = append(h.Store.Homework, newRow)

		// Release the lock BEFORE persistence and audit — these are
		// non-blocking queue operations but holding the global write lock
		// while they run blocks ALL other HTTP handlers (reads included),
		// causing the entire app to freeze.
		h.Store.Unlock()

		// Persist subject first (FK dependency), then homework.
		if subject != nil && body.SubjectID != "" && subject.ID != body.SubjectID {
			h.Persist("subjects", subject)
		}
		h.Persist("homework", newRow)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "homework", EntityID: newRow.ID, After: newRow,
		})
		h.invalidateList(r, ctx.SchoolID)

		// Take a brief read lock for hydration (joining class/teacher/subject names).
		h.Store.RLock()
		result := h.hydrate([]*store.Homework{newRow})[0]
		h.Store.RUnlock()
		return result, nil
	}))
}

// Update implements PATCH /api/homework/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "homework", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, hw := range h.Store.Homework {
			if hw.ID == id && hw.SchoolID == ctx.SchoolID {
				before := *hw
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &hw.Title)
				}
				if v, ok := body["instructions"]; ok {
					_ = json.Unmarshal(v, &hw.Instructions)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &hw.Status)
				}
				if v, ok := body["class_id"]; ok {
					_ = json.Unmarshal(v, &hw.ClassID)
				}
				if v, ok := body["section"]; ok {
					_ = json.Unmarshal(v, &hw.Section)
				}
				if v, ok := body["teacher_id"]; ok {
					_ = json.Unmarshal(v, &hw.TeacherID)
				}
				if v, ok := body["due_at"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						hw.DueAt = time.Date(d.Year(), d.Month(), d.Day(), 23, 59, 0, 0, time.UTC)
					}
				}
				if v, ok := body["attachments"]; ok {
					_ = json.Unmarshal(v, &hw.Attachments)
				}
				if v, ok := body["visibility"]; ok {
					_ = json.Unmarshal(v, &hw.Visibility)
				}
				hw.UpdatedAt = time.Now()
				h.Persist("homework", hw)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "homework", EntityID: id, Before: before, After: *hw,
				})
				h.invalidateList(r, ctx.SchoolID)
				return h.hydrate([]*store.Homework{hw})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Homework not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/homework/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "homework", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, hw := range h.Store.Homework {
			if hw.ID == id && hw.SchoolID == ctx.SchoolID {
				before := *hw
				h.Store.Homework = append(h.Store.Homework[:i], h.Store.Homework[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "homework", EntityID: id, Before: before,
				})
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Homework not found.", 404, nil)
	}))
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
