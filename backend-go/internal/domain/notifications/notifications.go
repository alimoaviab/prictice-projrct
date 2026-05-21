// Package notifications implements /api/notifications endpoints.
//
// Supports cursor-based pagination for infinite scroll:
//
//	GET /api/notifications?limit=20&cursor=<base64_encoded_timestamp>
//
// Response format:
//
//	{"data": [...], "next_cursor": "...", "has_more": true}
package notifications

import (
	"encoding/base64"
	"net/http"
	"sort"
	"strconv"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// cursorResponse is the cursor-based pagination envelope for notifications.
type cursorResponse struct {
	Data       []map[string]any `json:"data"`
	NextCursor string           `json:"next_cursor,omitempty"`
	HasMore    bool             `json:"has_more"`
	Total      int              `json:"total,omitempty"`
}

// List implements GET /api/notifications with cursor-based pagination.
//
// Query params:
//   - cursor: base64-encoded RFC3339 timestamp (created_at of last item)
//   - limit: number of items to return (default 20, max 100)
//
// Returns notifications newer-first. The cursor points to the created_at
// of the last returned item — pass it as `cursor` to get the next page.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	api.WriteResult(w, api.ServiceTry(func() (cursorResponse, error) {
		if err := auth.AssertPermission(ctx, "notifications", auth.ActionView); err != nil {
			return cursorResponse{}, err
		}

		// Parse limit
		limit := 20
		if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 {
			limit = l
		}
		if limit > 100 {
			limit = 100
		}

		// Parse cursor (base64-encoded RFC3339 timestamp)
		var cursorTime time.Time
		if cursorStr := q.Get("cursor"); cursorStr != "" {
			decoded, err := base64.URLEncoding.DecodeString(cursorStr)
			if err == nil {
				if t, err := time.Parse(time.RFC3339Nano, string(decoded)); err == nil {
					cursorTime = t
				}
			}
		}

		h.Store.RLock()
		// Collect all notifications for this user
		all := make([]*store.Notification, 0)
		for _, n := range h.Store.Notifications {
			if n.SchoolID == ctx.SchoolID && n.UserID == ctx.UserID {
				all = append(all, n)
			}
		}
		h.Store.RUnlock()

		// Sort by created_at DESC (newest first)
		sort.SliceStable(all, func(i, j int) bool {
			return all[i].CreatedAt.After(all[j].CreatedAt)
		})

		total := len(all)

		// Apply cursor filter: only items OLDER than cursor
		filtered := all
		if !cursorTime.IsZero() {
			filtered = make([]*store.Notification, 0)
			for _, n := range all {
				if n.CreatedAt.Before(cursorTime) {
					filtered = append(filtered, n)
				}
			}
		}

		// Take limit+1 to determine has_more
		hasMore := false
		if len(filtered) > limit {
			hasMore = true
			filtered = filtered[:limit]
		}

		// Build response items
		data := make([]map[string]any, 0, len(filtered))
		for _, n := range filtered {
			data = append(data, map[string]any{
				"_id":        n.ID,
				"school_id":  n.SchoolID,
				"user_id":    n.UserID,
				"title":      n.Title,
				"body":       n.Body,
				"category":   n.Category,
				"read":       n.Read,
				"created_at": n.CreatedAt,
			})
		}

		// Build next cursor from last item's created_at
		var nextCursor string
		if hasMore && len(filtered) > 0 {
			last := filtered[len(filtered)-1]
			encoded := base64.URLEncoding.EncodeToString(
				[]byte(last.CreatedAt.Format(time.RFC3339Nano)),
			)
			nextCursor = encoded
		}

		return cursorResponse{
			Data:       data,
			NextCursor: nextCursor,
			HasMore:    hasMore,
			Total:      total,
		}, nil
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
