// Package exams implements /api/exams endpoints. Mirrors
// old-app/shared/services/exam.service.ts.
package exams

import (
	"encoding/json"
	"net/http"
	"sort"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func (h *Handler) hydrate(rows []*store.Exam) []map[string]any {
	classByID := map[string]*store.Class{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	resultsByExam := map[string]int{}
	for _, r := range h.Store.Results {
		resultsByExam[r.ExamID]++
	}
	out := make([]map[string]any, 0, len(rows))
	for _, e := range rows {
		cls := classByID[e.ClassID]
		className := ""
		if cls != nil {
			className = cls.Name
		}
		out = append(out, map[string]any{
			"_id":              e.ID,
			"school_id":        e.SchoolID,
			"academic_year_id": e.AcademicYearID,
			"class_id":         e.ClassID,
			"class_name":       className,
			"teacher_id":       e.TeacherID,
			"subject":          e.Subject,
			"title":            e.Title,
			"starts_at":        api.FormatDate(e.StartsAt),
			"max_marks":        e.MaxMarks,
			"status":           e.Status,
			"description":      e.Description,
			"results_count":    resultsByExam[e.ID],
			"created_at":       e.CreatedAt,
			"updated_at":       e.UpdatedAt,
		})
	}
	return out
}

// List implements GET /api/exams.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		statusQ := q.Get("status")

		h.Store.RLock()
		rows := make([]*store.Exam, 0)
		for _, e := range h.Store.Exams {
			if e.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && e.AcademicYearID != "" && e.AcademicYearID != yearID {
				continue
			}
			if classID != "" && e.ClassID != classID {
				continue
			}
			if statusQ != "" && e.Status != statusQ {
				continue
			}
			rows = append(rows, e)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartsAt.After(rows[j].StartsAt)
		})

		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	}))
}

// Get implements GET /api/exams/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Exam{e})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
	}))
}

type createInput struct {
	ClassID     string `json:"class_id"`
	Subject     string `json:"subject"`
	Title       string `json:"title"`
	StartsAt    string `json:"starts_at"`
	MaxMarks    int    `json:"max_marks"`
	Status      string `json:"status,omitempty"`
	Description string `json:"description,omitempty"`
}

// Create implements POST /api/exams.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" || body.Subject == "" || body.Title == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id, subject and title are required.", 400, nil)
		}
		startsAt, ok := api.ParseDate(body.StartsAt)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid starts_at date.", 400, nil)
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		var class *store.Class
		for _, c := range h.Store.Classes {
			if c.ID == body.ClassID && c.SchoolID == ctx.SchoolID {
				class = c
				break
			}
		}
		if class == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Selected class was not found.", 404, nil)
		}

		now := time.Now()
		newRow := &store.Exam{
			ID:             store.NewID("exm"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: ctx.ActiveAcademicYearID,
			ClassID:        body.ClassID,
			TeacherID:      ifTeacherID(ctx),
			Subject:        body.Subject,
			Title:          body.Title,
			StartsAt:       startsAt,
			MaxMarks:       body.MaxMarks,
			Status:         orDefault(body.Status, "scheduled"),
			Description:    body.Description,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Exams = append(h.Store.Exams, newRow)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "exam", EntityID: newRow.ID, After: newRow,
		})
		return h.hydrate([]*store.Exam{newRow})[0], nil
	}))
}

func ifTeacherID(ctx *api.RequestContext) string {
	if ctx.Role == "teacher" {
		return ctx.UserID
	}
	return ""
}

// Update implements PATCH /api/exams/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				before := *e
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &e.Title)
				}
				if v, ok := body["subject"]; ok {
					_ = json.Unmarshal(v, &e.Subject)
				}
				if v, ok := body["max_marks"]; ok {
					_ = json.Unmarshal(v, &e.MaxMarks)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &e.Status)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &e.Description)
				}
				if v, ok := body["class_id"]; ok {
					_ = json.Unmarshal(v, &e.ClassID)
				}
				if v, ok := body["starts_at"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						e.StartsAt = d
					}
				}
				e.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "exam", EntityID: id, Before: before, After: *e,
				})
				return h.hydrate([]*store.Exam{e})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/exams/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "exams", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, e := range h.Store.Exams {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				before := *e
				h.Store.Exams = append(h.Store.Exams[:i], h.Store.Exams[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "exam", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Exam not found.", 404, nil)
	}))
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
