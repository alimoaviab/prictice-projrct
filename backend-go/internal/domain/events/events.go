// Package events implements /api/events endpoints. Mirrors
// old-app/shared/services/event.service.ts.
package events

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func (h *Handler) hydrate(rows []*store.Event) []map[string]any {
	out := make([]map[string]any, 0, len(rows))
	for _, e := range rows {
		out = append(out, map[string]any{
			"_id":              e.ID,
			"school_id":        e.SchoolID,
			"title":            e.Title,
			"description":      e.Description,
			"event_type":       e.EventType,
			"start_date":       api.FormatDate(e.StartDate),
			"end_date":         api.FormatDate(e.EndDate),
			"start_time":       e.StartTime,
			"end_time":         e.EndTime,
			"location":         e.Location,
			"visibility":       e.Visibility,
			"target_class_ids": e.TargetClassIDs,
			"organizer":        e.Organizer,
			"status":           e.Status,
			"created_by":       e.CreatedBy,
			"created_at":       e.CreatedAt,
			"updated_at":       e.UpdatedAt,
		})
	}
	return out
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "events", auth.ActionView); err != nil {
			return nil, err
		}
		statusQ := q.Get("status")
		eventType := q.Get("event_type")
		visibility := q.Get("visibility")
		classID := q.Get("class_id")
		startDate, hasStart := api.ParseDate(q.Get("start_date"))
		endDate, hasEnd := api.ParseDate(q.Get("end_date"))

		h.Store.RLock()
		rows := make([]*store.Event, 0)
		for _, e := range h.Store.Events {
			if e.SchoolID != ctx.SchoolID {
				continue
			}
			if statusQ != "" && e.Status != statusQ {
				continue
			}
			if eventType != "" && e.EventType != eventType {
				continue
			}
			if visibility != "" && e.Visibility != visibility {
				continue
			}
			if classID != "" {
				match := false
				for _, c := range e.TargetClassIDs {
					if c == classID {
						match = true
						break
					}
				}
				if !match {
					continue
				}
			}
			if hasStart && e.StartDate.Before(startDate) {
				continue
			}
			if hasEnd && e.StartDate.After(endDate) {
				continue
			}
			rows = append(rows, e)
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].StartDate.Before(rows[j].StartDate)
		})
		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), len(hydrated), page), nil
	}))
}

func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "events", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, e := range h.Store.Events {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Event{e})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Event not found.", 404, nil)
	}))
}

type createInput struct {
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	EventType      string   `json:"event_type"`
	StartDate      string   `json:"start_date"`
	EndDate        string   `json:"end_date"`
	StartTime      string   `json:"start_time"`
	EndTime        string   `json:"end_time"`
	Location       string   `json:"location"`
	Visibility     string   `json:"visibility"`
	TargetClassIDs []string `json:"target_class_ids"`
	Organizer      string   `json:"organizer"`
	Status         string   `json:"status"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "events", auth.ActionCreate); err != nil {
			return nil, err
		}
		if strings.TrimSpace(body.Title) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "title is required.", 400, nil)
		}
		startDate, ok := api.ParseDate(body.StartDate)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid start_date.", 400, nil)
		}
		endDate := startDate
		if body.EndDate != "" {
			d, ok := api.ParseDate(body.EndDate)
			if !ok {
				return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid end_date.", 400, nil)
			}
			endDate = d
		}
		if endDate.Before(startDate) {
			return nil, api.NewControlledError("VALIDATION_ERROR", "End date must be after start date.", 400, nil)
		}
		if body.Visibility == "specific_classes" && len(body.TargetClassIDs) == 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Target classes are required for specific_classes visibility.", 400, nil)
		}

		now := time.Now()
		row := &store.Event{
			ID:             store.NewID("evt"),
			SchoolID:       ctx.SchoolID,
			Title:          body.Title,
			Description:    body.Description,
			EventType:      body.EventType,
			StartDate:      startDate,
			EndDate:        endDate,
			StartTime:      body.StartTime,
			EndTime:        body.EndTime,
			Location:       body.Location,
			Visibility:     body.Visibility,
			TargetClassIDs: body.TargetClassIDs,
			Organizer:      body.Organizer,
			Status:         body.Status,
			CreatedBy:      ctx.UserID,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Lock()
		h.Store.Events = append(h.Store.Events, row)
		h.Store.Unlock()
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "event", EntityID: row.ID, After: row})
		return h.hydrate([]*store.Event{row})[0], nil
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
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "events", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, e := range h.Store.Events {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				before := *e
				if v, ok := body["title"]; ok {
					_ = json.Unmarshal(v, &e.Title)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &e.Description)
				}
				if v, ok := body["event_type"]; ok {
					_ = json.Unmarshal(v, &e.EventType)
				}
				if v, ok := body["start_time"]; ok {
					_ = json.Unmarshal(v, &e.StartTime)
				}
				if v, ok := body["end_time"]; ok {
					_ = json.Unmarshal(v, &e.EndTime)
				}
				if v, ok := body["location"]; ok {
					_ = json.Unmarshal(v, &e.Location)
				}
				if v, ok := body["visibility"]; ok {
					_ = json.Unmarshal(v, &e.Visibility)
				}
				if v, ok := body["target_class_ids"]; ok {
					_ = json.Unmarshal(v, &e.TargetClassIDs)
				}
				if v, ok := body["organizer"]; ok {
					_ = json.Unmarshal(v, &e.Organizer)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &e.Status)
				}
				if v, ok := body["start_date"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						e.StartDate = d
					}
				}
				if v, ok := body["end_date"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						e.EndDate = d
					}
				}
				if e.EndDate.Before(e.StartDate) {
					return nil, api.NewControlledError("VALIDATION_ERROR", "End date must be after start date.", 400, nil)
				}
				if e.Visibility == "specific_classes" && len(e.TargetClassIDs) == 0 {
					return nil, api.NewControlledError("VALIDATION_ERROR", "Target classes are required for specific_classes visibility.", 400, nil)
				}
				e.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "event", EntityID: id, Before: before, After: *e,
				})
				return h.hydrate([]*store.Event{e})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Event not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "events", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, e := range h.Store.Events {
			if e.ID == id && e.SchoolID == ctx.SchoolID {
				before := *e
				h.Store.Events = append(h.Store.Events[:i], h.Store.Events[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "event", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Event not found.", 404, nil)
	}))
}
