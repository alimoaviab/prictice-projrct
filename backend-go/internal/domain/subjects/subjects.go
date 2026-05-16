// Package subjects implements /api/subjects endpoints.
// Mirrors old-app/shared/services/subject.service.ts.
//
// Caching:
//
//	The list endpoint is hit by every form that picks a subject —
//	exams, tests, homework, timetable, classes — so the same query
//	often runs back-to-back from a single page load. We add a Redis
//	read-through cache scoped per-school. Writes (create / update /
//	delete) invalidate the cached list so consumers always see fresh
//	data. The single-row Get is left uncached because callers usually
//	already received the row in the list response.
//
//	If Redis is unavailable the handler degrades transparently — the
//	cache calls are no-ops and the original MemStore code path runs.
package subjects

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// subjectsCacheTTL — subjects rarely change after the academic year
// kicks off; a 10-minute hot-path window is plenty.
const subjectsCacheTTL = 10 * time.Minute

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Cache   *cache.Client
}

// New keeps the original signature for callers that don't pass cache.
// The handler runs without caching exactly like before this phase.
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

func listCacheKey(schoolID string) string {
	return fmt.Sprintf("subjects:list:%s", schoolID)
}

// invalidateList drops the per-school list cache after a write. Errors
// are swallowed — a stale 10-minute cache is preferable to a failed
// mutation.
func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.Del(r.Context(), listCacheKey(schoolID))
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	if err := auth.AssertPermission(ctx, "subjects", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), listCacheKey(ctx.SchoolID)); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() ([]*store.Subject, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()

		// Prepare teacher map for name lookup
		teachers := make(map[string]string)
		for _, t := range h.Store.Teachers {
			if t.SchoolID == ctx.SchoolID {
				teachers[t.ID] = t.FirstName + " " + t.LastName
			}
		}

		// Prepare class mapping map
		mapping := make(map[string][]string)
		for _, c := range h.Store.Classes {
			if c.SchoolID == ctx.SchoolID {
				for _, cs := range c.Subjects {
					mapping[cs.Name] = append(mapping[cs.Name], c.Name)
				}
			}
		}

		rows := make([]*store.Subject, 0)
		for _, s := range h.Store.Subjects {
			if s.SchoolID == ctx.SchoolID {
				// Enrich
				s.TeacherName = teachers[s.TeacherID]
				s.ClassMapping = mapping[s.Name]
				if s.ClassMapping == nil {
					s.ClassMapping = []string{}
				}
				rows = append(rows, s)
			}
		}
		sort.SliceStable(rows, func(i, j int) bool { return rows[i].Name < rows[j].Name })
		return rows, nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode subjects.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), listCacheKey(ctx.SchoolID), bytes, subjectsCacheTTL)
	}
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (*store.Subject, error) {
		if err := auth.AssertPermission(ctx, "subjects", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, s := range h.Store.Subjects {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				return s, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Subject not found.", 404, nil)
	}))
}

type subjectInput struct {
	Name         string `json:"name"`
	Code         string `json:"code"`
	Description  string `json:"description"`
	Status       string `json:"status"`
	TotalMarks   int    `json:"total_marks"`
	PassingMarks int    `json:"passing_marks"`
	TeacherID    string `json:"teacher_id"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body subjectInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Subject, error) {
		if err := auth.AssertPermission(ctx, "subjects", auth.ActionCreate); err != nil {
			return nil, err
		}
		if strings.TrimSpace(body.Name) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "name is required.", 400, nil)
		}
		now := time.Now()
		s := &store.Subject{
			ID:           store.NewID("sub"),
			SchoolID:     ctx.SchoolID,
			Name:         body.Name,
			Code:         body.Code,
			Description:  body.Description,
			Status:       defaultStr(body.Status, "active"),
			TotalMarks:   body.TotalMarks,
			PassingMarks: body.PassingMarks,
			TeacherID:    body.TeacherID,
			CreatedAt:    now,
		}
		h.Store.Lock()
		h.Store.Subjects = append(h.Store.Subjects, s)
		h.Store.Unlock()
		h.Persist("subjects", s)
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "subject", EntityID: s.ID, After: s})
		h.invalidateList(r, ctx.SchoolID)
		return s, nil
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
	api.WriteResult(w, api.ServiceTry(func() (*store.Subject, error) {
		if err := auth.AssertPermission(ctx, "subjects", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, s := range h.Store.Subjects {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				before := *s
				if v, ok := body["name"]; ok {
					_ = json.Unmarshal(v, &s.Name)
				}
				if v, ok := body["code"]; ok {
					_ = json.Unmarshal(v, &s.Code)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &s.Description)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &s.Status)
				}
				if v, ok := body["total_marks"]; ok {
					_ = json.Unmarshal(v, &s.TotalMarks)
				}
				if v, ok := body["passing_marks"]; ok {
					_ = json.Unmarshal(v, &s.PassingMarks)
				}
				if v, ok := body["teacher_id"]; ok {
					_ = json.Unmarshal(v, &s.TeacherID)
				}
				h.Persist("subjects", s)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "subject", EntityID: id, Before: before, After: *s,
				})
				h.invalidateList(r, ctx.SchoolID)
				return s, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Subject not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "subjects", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, s := range h.Store.Subjects {
			if s.ID == id && s.SchoolID == ctx.SchoolID {
				before := *s
				h.Store.Subjects = append(h.Store.Subjects[:i], h.Store.Subjects[i+1:]...)
				h.Persist("subjects:delete", before.ID)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "subject", EntityID: id, Before: before,
				})
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Subject not found.", 404, nil)
	}))
}

func defaultStr(v, fallback string) string {
	if strings.TrimSpace(v) == "" {
		return fallback
	}
	return v
}
