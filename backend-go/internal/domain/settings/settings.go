// Package settings implements /api/settings endpoints. Mirrors the school
// profile / branding settings the original Settings page reads.
package settings

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func (h *Handler) findSettings(schoolID string) *store.SchoolSettings {
	for _, s := range h.Store.SchoolSettings {
		if s.SchoolID == schoolID {
			return s
		}
	}
	return nil
}

// Get implements GET /api/settings.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "settings", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		s := h.findSettings(ctx.SchoolID)
		if s == nil {
			return map[string]any{"school_id": ctx.SchoolID, "profile": nil, "branding": nil, "academic": nil}, nil
		}
		return s, nil
	}))
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
		return s, nil
	}))
}
