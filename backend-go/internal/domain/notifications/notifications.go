// Package notifications implements /api/notifications endpoints.
package notifications

import (
	"net/http"
	"sort"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() ([]*store.Notification, error) {
		if err := auth.AssertPermission(ctx, "notifications", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		rows := make([]*store.Notification, 0)
		for _, n := range h.Store.Notifications {
			if n.SchoolID == ctx.SchoolID && n.UserID == ctx.UserID {
				rows = append(rows, n)
			}
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].CreatedAt.After(rows[j].CreatedAt)
		})
		return rows, nil
	}))
}

func (h *Handler) MarkRead(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "notifications", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, n := range h.Store.Notifications {
			if n.ID == id && n.SchoolID == ctx.SchoolID && n.UserID == ctx.UserID {
				n.Read = true
				return n, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Notification not found.", 404, nil)
	}))
}
