// Package leave implements /api/leave endpoints. Mirrors
// old-app/shared/services/leave.service.ts.
package leave

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

func (h *Handler) hydrate(rows []*store.Leave) []map[string]any {
	out := make([]map[string]any, 0, len(rows))
	for _, l := range rows {
		out = append(out, map[string]any{
			"_id":              l.ID,
			"school_id":        l.SchoolID,
			"requester_type":   l.RequesterType,
			"requester_id":     l.RequesterID,
			"requester_name":   l.RequesterName,
			"class_id":         l.ClassID,
			"class_name":       l.ClassName,
			"leave_type":       l.LeaveType,
			"start_date":       api.FormatDate(l.StartDate),
			"end_date":         api.FormatDate(l.EndDate),
			"reason":           l.Reason,
			"status":           l.Status,
			"attachments":      l.Attachments,
			"approved_by":      l.ApprovedBy,
			"approved_at":      l.ApprovedAt,
			"rejection_reason": l.RejectionReason,
			"created_at":       l.CreatedAt,
			"updated_at":       l.UpdatedAt,
		})
	}
	return out
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "leave", auth.ActionView); err != nil {
			return nil, err
		}
		statusQ := q.Get("status")
		requesterType := q.Get("requester_type")
		requesterID := q.Get("requester_id")

		// If student, force filter to their own requests.
		if ctx.Role == "student" {
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.UserID == ctx.UserID {
					requesterID = s.ID
					break
				}
			}
			h.Store.RUnlock()
			requesterType = "student"
		}

		// If teacher, force filter to their own requests as well, so the
		// teacher portal only ever sees the teacher's own submissions.
		if ctx.Role == "teacher" {
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.UserID == ctx.UserID {
					requesterID = t.ID
					break
				}
			}
			h.Store.RUnlock()
			requesterType = "teacher"
		}

		startDate, hasStart := api.ParseDate(q.Get("start_date"))
		endDate, hasEnd := api.ParseDate(q.Get("end_date"))

		h.Store.RLock()
		rows := make([]*store.Leave, 0)
		for _, l := range h.Store.Leaves {
			if l.SchoolID != ctx.SchoolID {
				continue
			}
			if statusQ != "" && l.Status != statusQ {
				continue
			}
			if requesterType != "" && l.RequesterType != requesterType {
				continue
			}
			if requesterID != "" && l.RequesterID != requesterID {
				continue
			}
			if hasStart && l.StartDate.Before(startDate) {
				continue
			}
			if hasEnd && l.StartDate.After(endDate) {
				continue
			}
			rows = append(rows, l)
		}
		h.Store.RUnlock()
		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].CreatedAt.After(rows[j].CreatedAt)
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
		if err := auth.AssertPermission(ctx, "leave", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, l := range h.Store.Leaves {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Leave{l})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Leave request not found.", 404, nil)
	}))
}

type createInput struct {
	RequesterType string   `json:"requester_type"`
	RequesterID   string   `json:"requester_id"`
	RequesterName string   `json:"requester_name"`
	LeaveType     string   `json:"leave_type"`
	StartDate     string   `json:"start_date"`
	EndDate       string   `json:"end_date"`
	Reason        string   `json:"reason"`
	Attachments   []string `json:"attachments"`
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "leave", auth.ActionCreate); err != nil {
			return nil, err
		}

		// If student is creating, force requester info to themselves.
		if ctx.Role == "student" {
			body.RequesterType = "student"
			h.Store.RLock()
			for _, s := range h.Store.Students {
				if s.UserID == ctx.UserID && s.SchoolID == ctx.SchoolID {
					body.RequesterID = s.ID
					body.RequesterName = s.FirstName + " " + s.LastName
					break
				}
			}
			h.Store.RUnlock()
			if body.RequesterID == "" {
				return nil, api.NewControlledError("NOT_FOUND", "Student profile not found.", 404, nil)
			}
		}

		// If teacher is creating, force requester info to themselves so
		// the teacher portal can simply post {leave_type, dates, reason}
		// without having to know its own teacher record id.
		if ctx.Role == "teacher" {
			body.RequesterType = "teacher"
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.UserID == ctx.UserID && t.SchoolID == ctx.SchoolID {
					body.RequesterID = t.ID
					body.RequesterName = t.FirstName + " " + t.LastName
					break
				}
			}
			h.Store.RUnlock()
			if body.RequesterID == "" {
				return nil, api.NewControlledError("NOT_FOUND", "Teacher profile not found.", 404, nil)
			}
		}

		if body.RequesterType != "student" && body.RequesterType != "teacher" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "requester_type must be student or teacher.", 400, nil)
		}
		startDate, ok := api.ParseDate(body.StartDate)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid start_date.", 400, nil)
		}
		endDate, ok := api.ParseDate(body.EndDate)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid end_date.", 400, nil)
		}
		if endDate.Before(startDate) {
			return nil, api.NewControlledError("VALIDATION_ERROR", "End date must be after start date.", 400, nil)
		}

		// Resolve requester and class info.
		var classID, className string
		h.Store.RLock()
		exists := false
		switch body.RequesterType {
		case "student":
			for _, s := range h.Store.Students {
				if s.ID == body.RequesterID && s.SchoolID == ctx.SchoolID {
					exists = true
					if body.RequesterName == "" {
						body.RequesterName = s.FirstName + " " + s.LastName
					}
					classID = s.ClassID
					// Find class name
					for _, c := range h.Store.Classes {
						if c.ID == s.ClassID {
							className = c.Name
							if s.Section != "" {
								className += " (" + s.Section + ")"
							}
							break
						}
					}
					break
				}
			}
		case "teacher":
			for _, t := range h.Store.Teachers {
				if t.ID == body.RequesterID && t.SchoolID == ctx.SchoolID {
					exists = true
					if body.RequesterName == "" {
						body.RequesterName = t.FirstName + " " + t.LastName
					}
					break
				}
			}
		}
		h.Store.RUnlock()

		if !exists {
			return nil, api.NewControlledError("NOT_FOUND", "Requester not found.", 404, nil)
		}

		now := time.Now()
		row := &store.Leave{
			ID:            store.NewID("lev"),
			SchoolID:      ctx.SchoolID,
			RequesterType: body.RequesterType,
			RequesterID:   body.RequesterID,
			RequesterName: body.RequesterName,
			ClassID:       classID,
			ClassName:     className,
			LeaveType:     body.LeaveType,
			StartDate:     startDate,
			EndDate:       endDate,
			Reason:        body.Reason,
			Status:        "pending",
			Attachments:   body.Attachments,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		h.Store.Lock()
		h.Store.Leaves = append(h.Store.Leaves, row)
		h.Store.Unlock()
		audit.Write(h.Store, ctx, audit.Input{Action: "create", EntityType: "leave", EntityID: row.ID, After: row})
		return h.hydrate([]*store.Leave{row})[0], nil
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
		if err := auth.AssertPermission(ctx, "leave", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, l := range h.Store.Leaves {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				// Only pending requests editable, except cancellation.
				newStatus := l.Status
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &newStatus)
				}
				if l.Status != "pending" && newStatus != "cancelled" {
					return nil, api.NewControlledError("INVALID_STATE", "Only pending requests can be updated.", 400, nil)
				}
				before := *l
				if newStatus != l.Status {
					l.Status = newStatus
					if newStatus == "approved" {
						now := time.Now()
						l.ApprovedBy = ctx.UserID
						l.ApprovedAt = &now
					} else if newStatus == "rejected" {
						if v, ok := body["rejection_reason"]; ok {
							_ = json.Unmarshal(v, &l.RejectionReason)
						}
					}
				}
				if v, ok := body["leave_type"]; ok {
					_ = json.Unmarshal(v, &l.LeaveType)
				}
				if v, ok := body["reason"]; ok {
					_ = json.Unmarshal(v, &l.Reason)
				}
				if v, ok := body["start_date"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						l.StartDate = d
					}
				}
				if v, ok := body["end_date"]; ok {
					var s string
					_ = json.Unmarshal(v, &s)
					if d, ok := api.ParseDate(s); ok {
						l.EndDate = d
					}
				}
				if l.EndDate.Before(l.StartDate) {
					return nil, api.NewControlledError("VALIDATION_ERROR", "End date must be after start date.", 400, nil)
				}
				l.UpdatedAt = time.Now()
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "leave", EntityID: id, Before: before, After: *l,
				})
				return h.hydrate([]*store.Leave{l})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Leave request not found.", 404, nil)
	}))
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "leave", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, l := range h.Store.Leaves {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				if l.Status != "pending" {
					return nil, api.NewControlledError("INVALID_STATE", "Only pending requests can be cancelled.", 400, nil)
				}
				before := *l
				h.Store.Leaves = append(h.Store.Leaves[:i], h.Store.Leaves[i+1:]...)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "leave", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Leave request not found.", 404, nil)
	}))
}
