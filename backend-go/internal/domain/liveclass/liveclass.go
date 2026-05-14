// Package liveclass implements /api/live/classes endpoints. Mirrors
// old-app/shared/services/live/live-class.service.ts. Live classes are
// ordinary scheduled meetings tied to a class — there is no WebSocket layer
// in the original, just a REST resource the React UI polls.
package liveclass

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

func (h *Handler) hydrate(rows []*store.LiveClass) []map[string]any {
	classByID := map[string]*store.Class{}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	out := make([]map[string]any, 0, len(rows))
	for _, l := range rows {
		cls := classByID[l.ClassID]
		className := ""
		if cls != nil {
			className = cls.Name
		}
		out = append(out, map[string]any{
			"_id":              l.ID,
			"school_id":        l.SchoolID,
			"academic_year_id": l.AcademicYearID,
			"class_id":         l.ClassID,
			"class_name":       className,
			"subject":          l.Subject,
			"title":            l.Title,
			"starts_at":        l.StartsAt,
			"ends_at":          l.EndsAt,
			"host_teacher_id":  l.HostTeacherID,
			"join_url":         l.JoinURL,
			"provider":         l.Provider,
			"status":           l.Status,
			"created_at":       l.CreatedAt,
			"updated_at":       l.UpdatedAt,
		})
	}
	return out
}

// List implements GET /api/live/classes.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		statusQ := q.Get("status")

		// Student scoping: only their class.
		if ctx.Role == "student" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
					classID = s.ClassID
					break
				}
			}
			h.Store.RUnlock()
		}

		h.Store.RLock()
		rows := make([]*store.LiveClass, 0)
		for _, l := range h.Store.LiveClasses {
			if l.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && l.AcademicYearID != "" && l.AcademicYearID != yearID {
				continue
			}
			if classID != "" && l.ClassID != classID {
				continue
			}
			if statusQ != "" && l.Status != statusQ {
				continue
			}
			rows = append(rows, l)
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

type scheduleInput struct {
	ClassID       string `json:"class_id"`
	Subject       string `json:"subject"`
	Title         string `json:"title"`
	StartsAt      string `json:"starts_at"`
	EndsAt        string `json:"ends_at"`
	HostTeacherID string `json:"host_teacher_id"`
	JoinURL       string `json:"join_url"`
	Provider      string `json:"provider"`
}

// Schedule implements POST /api/live/classes/schedule.
func (h *Handler) Schedule(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body scheduleInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionCreate); err != nil {
			return nil, err
		}
		startsAt, okS := api.ParseDate(body.StartsAt)
		endsAt, okE := api.ParseDate(body.EndsAt)
		if body.ClassID == "" || body.Title == "" || !okS || !okE {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id, title, starts_at, ends_at are required.", 400, nil)
		}
		if endsAt.Before(startsAt) {
			return nil, api.NewControlledError("VALIDATION_ERROR", "ends_at must be after starts_at.", 400, nil)
		}

		// Auto-generate a join URL if not provided
		joinURL := body.JoinURL
		if joinURL == "" {
			joinURL = "https://meet.google.com/edu-" + store.NewID("")[0:8]
		}

		now := time.Now()
		row := &store.LiveClass{
			ID:             store.NewID("liv"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: ctx.ActiveAcademicYearID,
			ClassID:        body.ClassID,
			Subject:        body.Subject,
			Title:          body.Title,
			StartsAt:       startsAt,
			EndsAt:         endsAt,
			HostTeacherID:  body.HostTeacherID,
			JoinURL:        joinURL,
			Provider:       orDefault(body.Provider, "google_meet"),
			Status:         "scheduled",
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Lock()
		h.Store.LiveClasses = append(h.Store.LiveClasses, row)
		h.Store.Unlock()
		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "class", EntityID: row.ID, After: row,
			Metadata: map[string]any{"scope": "live_class"},
		})
		return h.hydrate([]*store.LiveClass{row})[0], nil
	}))
}

// Get implements GET /api/live/classes/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.LiveClass{l})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
	}))
}

// UpdateStatus implements PATCH /api/live/classes/:id with `status` payload —
// matches `LiveClassService.updateClassStatus` in the original.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				before := *l
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &l.Title)
				}
				if v, ok := body["subject"]; ok {
					_ = json.Unmarshal(v, &l.Subject)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &l.Status)
				}
				if v, ok := body["join_url"]; ok {
					_ = json.Unmarshal(v, &l.JoinURL)
				}
				if v, ok := body["starts_at"]; ok {
					_ = json.Unmarshal(v, &l.StartsAt)
				}
				if v, ok := body["ends_at"]; ok {
					_ = json.Unmarshal(v, &l.EndsAt)
				}
				l.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "class", EntityID: id, Before: before, After: *l,
					Metadata: map[string]any{"scope": "live_class"},
				})
				return h.hydrate([]*store.LiveClass{l})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/live/classes/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, l := range h.Store.LiveClasses {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				before := *l
				h.Store.LiveClasses = append(h.Store.LiveClasses[:i], h.Store.LiveClasses[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "class", EntityID: id, Before: before,
					Metadata: map[string]any{"scope": "live_class"},
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Live class not found.", 404, nil)
	}))
}

func orDefault(v, d string) string {
	if v == "" {
		return d
	}
	return v
}
