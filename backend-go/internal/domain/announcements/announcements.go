// Package announcements implements /api/announcements endpoints. Mirrors
// old-app/shared/services/announcement.service.ts.
package announcements

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
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

const announcementsListCacheTTL = 60 * time.Second

type Handler struct {
	Store *store.MemStore
	Cache *cache.Client
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func NewWithCache(s *store.MemStore, c *cache.Client) *Handler {
	return &Handler{Store: s, Cache: c}
}

// listCacheKey hashes (school, query). The list itself doesn't change
// per-role today (audience filtering happens per-row at the consumer
// layer), so a school-scoped key is sufficient.
func listCacheKey(schoolID, query string) string {
	src := fmt.Sprintf("%s|%s", schoolID, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("announcements:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("announcements:list:%s:*", schoolID))
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	if err := auth.AssertPermission(ctx, "announcements", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	cacheKey := listCacheKey(ctx.SchoolID, r.URL.RawQuery)
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() ([]*store.Announcement, error) {
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
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode announcements.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, announcementsListCacheTTL)
	}
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
		h.invalidateList(r, ctx.SchoolID)
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
				h.invalidateList(r, ctx.SchoolID)
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
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Announcement not found.", 404, nil)
	}))
}
