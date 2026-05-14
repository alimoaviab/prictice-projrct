// Package classes implements /api/classes endpoints. Mirrors
// old-app/shared/services/class.service.ts with the subset of fields the
// React frontend currently consumes.
package classes

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
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

// List implements GET /api/classes.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))

		h.Store.RLock()
		rows := make([]*store.Class, 0)
		for _, c := range h.Store.Classes {
			if c.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && c.AcademicYearID != yearID {
				continue
			}
			rows = append(rows, c)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].Name < rows[j].Name
		})

		page := api.ParsePagination(q)
		if !page.Enabled {
			// Always return paginated shape for consistency
			total := len(rows)
			return map[string]any{
				"data": rows,
				"meta": map[string]any{
					"total": total,
					"page":  1,
					"limit": total,
					"pages": 1,
				},
			}, nil
		}
		total := len(rows)
		start := page.Skip
		end := start + page.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		pages := total / page.Limit
		if total%page.Limit != 0 {
			pages++
		}
		if pages < 1 {
			pages = 1
		}
		return map[string]any{
			"data": rows[start:end],
			"meta": map[string]any{
				"total": total,
				"page":  page.Page,
				"limit": page.Limit,
				"pages": pages,
			},
		}, nil
	}))
}

// Get implements GET /api/classes/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				return c, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

type createInput struct {
	Name              string   `json:"name"`
	Code              string   `json:"code"`
	Grade             string   `json:"grade"`
	Section           string   `json:"section"`
	Capacity          int      `json:"capacity"`
	PassingPercentage int      `json:"passing_percentage"`
	ClassTeacherID    string   `json:"class_teacher_id,omitempty"`
	TeacherIDs        []string `json:"teacher_ids,omitempty"`
	SubjectIDs        []string `json:"subject_ids,omitempty"`
	RoomNumber        string   `json:"room_number,omitempty"`
	Description       string   `json:"description,omitempty"`
	AcademicYearID    string   `json:"academic_year_id,omitempty"`
}

// Create implements POST /api/classes.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Class, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionCreate); err != nil {
			return nil, err
		}
		if strings.TrimSpace(body.Name) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "name is required.", 400, nil)
		}
		yearID := body.AcademicYearID
		if yearID == "" {
			yearID = tenant.ResolveAcademicYearID(h.Store, ctx, "")
		}
		if yearID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "No active academic year found for this school.", 400, nil)
		}
		now := time.Now()
		newClass := &store.Class{
			ID:                store.NewID("cls"),
			SchoolID:          ctx.SchoolID,
			AcademicYearID:    yearID,
			Name:              body.Name,
			Code:              body.Code,
			Grade:             body.Grade,
			Section:           body.Section,
			Capacity:          body.Capacity,
			PassingPercentage: body.PassingPercentage,
			ClassTeacherID:    body.ClassTeacherID,
			TeacherIDs:        body.TeacherIDs,
			SubjectIDs:        body.SubjectIDs,
			RoomNumber:        body.RoomNumber,
			Description:       body.Description,
			Status:            "active",
			CreatedAt:         now,
			UpdatedAt:         now,
		}
		h.Store.Lock()
		h.Store.Classes = append(h.Store.Classes, newClass)
		h.Store.Unlock()

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "class", EntityID: newClass.ID, After: newClass,
		})
		return newClass, nil
	}))
}

// Update implements PATCH /api/classes/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Class, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				before := *c
				if v, ok := body["name"]; ok {
					_ = json.Unmarshal(v, &c.Name)
				}
				if v, ok := body["code"]; ok {
					_ = json.Unmarshal(v, &c.Code)
				}
				if v, ok := body["grade"]; ok {
					_ = json.Unmarshal(v, &c.Grade)
				}
				if v, ok := body["section"]; ok {
					_ = json.Unmarshal(v, &c.Section)
				}
				if v, ok := body["capacity"]; ok {
					_ = json.Unmarshal(v, &c.Capacity)
				}
				if v, ok := body["passing_percentage"]; ok {
					_ = json.Unmarshal(v, &c.PassingPercentage)
				}
				if v, ok := body["class_teacher_id"]; ok {
					_ = json.Unmarshal(v, &c.ClassTeacherID)
				}
				if v, ok := body["teacher_ids"]; ok {
					_ = json.Unmarshal(v, &c.TeacherIDs)
				}
				if v, ok := body["subject_ids"]; ok {
					_ = json.Unmarshal(v, &c.SubjectIDs)
				}
				if v, ok := body["room_number"]; ok {
					_ = json.Unmarshal(v, &c.RoomNumber)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &c.Description)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &c.Status)
				}
				c.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "class", EntityID: id,
					Before: before, After: *c,
				})
				return c, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/classes/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				before := *c
				h.Store.Classes = append(h.Store.Classes[:i], h.Store.Classes[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "class", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}
