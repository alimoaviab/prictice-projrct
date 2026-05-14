// Package announcements implements /api/announcements endpoints. Mirrors
// old-app/shared/services/announcement.service.ts.
package announcements

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

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() ([]*store.Announcement, error) {
		if err := auth.AssertPermission(ctx, "announcements", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		rows := make([]*store.Announcement, 0)
		for _, a := range h.Store.Announcements {
			if a.SchoolID == ctx.SchoolID {
				rows = append(rows, a)
			}
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].CreatedAt.After(rows[j].CreatedAt)
		})
		return rows, nil
	}))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (*store.Announcement, error) {
		if err := auth.AssertPermission(ctx, "announcements", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, a := range h.Store.Announcements {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				return a, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Announcement not found.", 404, nil)
	}))
}

type createInput struct {
	Title    string `json:"title"`
	Body     string `json:"body"`
	Audience string `json:"audience"`
	Priority string `json:"priority"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Announcement, error) {
		if err := auth.AssertPermission(ctx, "announcements", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.Title == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "title is required.", 400, nil)
		}
		now := time.Now()
		row := &store.Announcement{
			ID:        store.NewID("ann"),
			SchoolID:  ctx.SchoolID,
			Title:     body.Title,
			Body:      body.Body,
			Audience:  body.Audience,
			Priority:  body.Priority,
			CreatedBy: ctx.UserID,
			CreatedAt: now,
			UpdatedAt: now,
		}
		h.Store.Lock()
		h.Store.Announcements = append(h.Store.Announcements, row)
		h.Store.Unlock()
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "announcement", EntityID: row.ID, After: row})
		return row, nil
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
	api.WriteResult(w, api.ServiceTry(func() (*store.Announcement, error) {
		if err := auth.AssertPermission(ctx, "announcements", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, a := range h.Store.Announcements {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				before := *a
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &a.Title)
				}
				if v, ok := body["body"]; ok {
					_ = json.Unmarshal(v, &a.Body)
				}
				if v, ok := body["audience"]; ok {
					_ = json.Unmarshal(v, &a.Audience)
				}
				if v, ok := body["priority"]; ok {
					_ = json.Unmarshal(v, &a.Priority)
				}
				a.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "announcement", EntityID: id, Before: before, After: *a,
				})
				return a, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Announcement not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "announcements", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, a := range h.Store.Announcements {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				before := *a
				h.Store.Announcements = append(h.Store.Announcements[:i], h.Store.Announcements[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "announcement", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Announcement not found.", 404, nil)
	}))
}
