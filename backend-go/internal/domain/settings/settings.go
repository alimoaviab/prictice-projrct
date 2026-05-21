// Package settings implements /api/settings endpoints. Mirrors the school
// profile / branding settings the original Settings page reads.
//
// Caching:
//
//	Settings are read on almost every page mount (the SchoolShell pulls
//	branding + school profile to render the header), but they change
//	maybe once a week. We add a thin Redis read-through cache here —
//	hit returns the bytes directly, miss falls through to the existing
//	MemStore lookup. The cache key is `settings:{school_id}`, TTL 30
//	minutes, and writes invalidate via DEL. If Redis is unavailable
//	the handler degrades to the original behaviour transparently.
package settings

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
)

// settingsCacheTTL — how long we keep a hydrated settings response in
// Redis. Settings rarely change so a 30-minute TTL is safe; explicit
// invalidation on Update makes the user's own edits feel instant.
const settingsCacheTTL = 30 * time.Minute

type Handler struct {
	Store   *store.MemStore
	Cache   *cache.Client
	Persist func(table string, doc any)
}

// New keeps the original signature so existing callers continue to
// compile without changes. It runs without a cache layer (graceful
// degrade — same behaviour as before this phase).
func New(s *store.MemStore) *Handler { return &Handler{Store: s, Persist: func(string, any) {}} }

// NewWithCache attaches a Redis client. Pass nil to opt out — the
// handler treats a nil/unavailable cache as "no cache" and reads
// directly from the MemStore exactly like before.
func NewWithCache(s *store.MemStore, c *cache.Client) *Handler {
	return &Handler{Store: s, Cache: c, Persist: func(string, any) {}}
}

// NewWithCacheAndPersist attaches both Redis and a persistence function.
func NewWithCacheAndPersist(s *store.MemStore, c *cache.Client, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Cache: c, Persist: save}
}

func (h *Handler) findSettings(schoolID string) *store.SchoolSettings {
	for _, s := range h.Store.SchoolSettings {
		if s.SchoolID == schoolID {
			return s
		}
	}
	return nil
}

func cacheKey(schoolID string) string {
	return fmt.Sprintf("settings:%s", schoolID)
}

// invalidate removes the settings cache entry for a school. Called from
// Update so the next Get returns the fresh value. Errors are swallowed
// — a stale 30-minute cache is preferable to a failed mutation.
func (h *Handler) invalidate(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.Del(r.Context(), cacheKey(schoolID))
}

// Get implements GET /api/settings.
//
// Read path:
//  1. If cache is available, GET the cached JSON. Hit → write it
//     verbatim (same envelope as ServiceTry produces).
//  2. Miss / no cache → run the original handler logic.
//  3. After serializing the response we store the bytes in Redis so
//     the next call hits.
//
// We deliberately cache the FULL envelope (api.Result) rather than
// just the inner data so the response goes out byte-for-byte
// identical to the un-cached path.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)

	// Permission check has to run on every request so unauthenticated
	// callers never even see cached bytes. We do it BEFORE the cache
	// read.
	if err := auth.AssertPermission(ctx, "settings", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey(ctx.SchoolID)); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	// Cache miss / no cache — original logic.
	result := api.ServiceTry(func() (any, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()
		s := h.findSettings(ctx.SchoolID)
		if s == nil {
			return map[string]any{
				"school_id": ctx.SchoolID,
				"profile":   nil,
				"branding":  nil,
				"academic":  nil,
			}, nil
		}
		return s, nil
	})

	// Marshal once, write the bytes, then push the same bytes into
	// Redis. We deliberately cache the FULL envelope so the cached
	// path is wire-identical to the un-cached path.
	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode settings.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey(ctx.SchoolID), bytes, settingsCacheTTL)
	}
}

type updateInput struct {
	Profile  map[string]any `json:"profile"`
	Branding map[string]any `json:"branding"`
	Academic map[string]any `json:"academic"`
}

// Update implements PATCH /api/settings.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body updateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.SchoolSettings, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		s := h.findSettings(ctx.SchoolID)
		now := time.Now()
		if s == nil {
			s = &store.SchoolSettings{SchoolID: ctx.SchoolID, UpdatedAt: now}
			h.Store.SchoolSettings = append(h.Store.SchoolSettings, s)
		}
		if body.Profile != nil {
			s.Profile = body.Profile

			// Sync to master School record for Super Admin visibility
			for _, school := range h.Store.Schools {
				if school.SchoolID == ctx.SchoolID {
					if name, ok := body.Profile["schoolName"].(string); ok && name != "" {
						school.Name = name
					}
					if email, ok := body.Profile["email"].(string); ok {
						school.Email = email
					}
					if phone, ok := body.Profile["phone"].(string); ok {
						school.Phone = phone
					}
					if addr, ok := body.Profile["address"].(string); ok {
						school.Address = addr
					}
					if city, ok := body.Profile["city"].(string); ok {
						school.City = city
					}
					if princ, ok := body.Profile["principalName"].(string); ok {
						school.PrincipalName = princ
					}
					if web, ok := body.Profile["website"].(string); ok {
						school.Website = web
					}
					school.UpdatedAt = now
					h.Persist("schools", school)
					break
				}
			}
		}
		if body.Branding != nil {
			s.Branding = body.Branding
		}
		if body.Academic != nil {
			s.Academic = body.Academic
		}
		s.UpdatedAt = now
		audit.Write(h.Store, ctx, audit.Input{
			Action: "update", EntityType: "school", EntityID: ctx.SchoolID,
			After:    s,
			Metadata: map[string]any{"scope": "settings"},
		})
		// Invalidate the cache after a successful update so the next
		// Get returns fresh bytes.
		h.invalidate(r, ctx.SchoolID)
		return s, nil
	}))
}
