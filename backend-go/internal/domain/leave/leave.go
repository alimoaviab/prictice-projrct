// Package leave implements /api/leave endpoints. Mirrors
// old-app/shared/services/leave.service.ts.
package leave

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

const leaveListCacheTTL = 60 * time.Second

type Handler struct {
	Store *store.MemStore
	Cache *cache.Client
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

func NewWithCache(s *store.MemStore, c *cache.Client) *Handler {
	return &Handler{Store: s, Cache: c}
}

// listCacheKey hashes (school, role, requesterID, query). Role +
// requester id matter because a student is force-scoped to their own
// leave records — sharing a cache entry across users would leak.
func listCacheKey(schoolID, role, requesterID, query string) string {
	src := fmt.Sprintf("%s|%s|%s|%s", schoolID, role, requesterID, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("leave:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("leave:list:%s:*", schoolID))
}

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

	if err := auth.AssertPermission(ctx, "leave", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	// Resolve scoping requester id outside the cache key so two
	// different students never share an entry.
	var scopedRequesterID string
	if ctx.Role == "student" {
		h.Store.RLock()
		for _, s := range h.Store.Students {
			if s.UserID == ctx.UserID {
				scopedRequesterID = s.ID
				break
			}
		}
		h.Store.RUnlock()
	} else if ctx.Role == "teacher" {
		h.Store.RLock()
		for _, t := range h.Store.Teachers {
			if t.UserID == ctx.UserID {
				scopedRequesterID = t.ID
				break
			}
		}
		h.Store.RUnlock()
	}

	// Parent scope is union-of-children. We compute the set once and
	// fold it into the cache key so two parents with different
	// linked children never share a cached payload.
	//
	// Dev-seed compatibility: same fallback as the create handler —
	// when the StudentParents table hasn't been populated, the rest
	// of the parent portal treats every student in the tenant as a
	// child (see parent.resolveStudent). We mirror that here so the
	// list isn't empty when the dashboard / attendance pages happily
	// resolve a child.
	var parentChildIDs []string
	if ctx.Role == "parent" {
		h.Store.RLock()
		seen := map[string]bool{}
		for _, link := range h.Store.StudentParents {
			if link.SchoolID == ctx.SchoolID && link.ParentUserID == ctx.UserID && !seen[link.StudentID] {
				parentChildIDs = append(parentChildIDs, link.StudentID)
				seen[link.StudentID] = true
			}
		}
		if len(parentChildIDs) == 0 {
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && !seen[s.ID] {
					parentChildIDs = append(parentChildIDs, s.ID)
					seen[s.ID] = true
				}
			}
		}
		h.Store.RUnlock()
		sort.Strings(parentChildIDs)
		scopedRequesterID = "parent:" + fmt.Sprintf("%v", parentChildIDs)
	}

	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, scopedRequesterID, q.Encode())
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
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

		// If teacher, show both their own teacher leave requests AND student
		// leave requests for classes they're assigned to (head teacher review).
		// Build a set of allowed leave records:
		//   1. Their own teacher leaves (requesterType=teacher, requesterID=teacher_id)
		//   2. Student leaves for their assigned classes (requesterType=student, classID in teacher.classIDs)
		var teacherOwnID string
		var teacherClassIDs map[string]bool
		if ctx.Role == "teacher" {
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.UserID == ctx.UserID {
					teacherOwnID = t.ID
					teacherClassIDs = make(map[string]bool)
					for _, cid := range t.ClassIDs {
						teacherClassIDs[cid] = true
					}
					break
				}
			}
			h.Store.RUnlock()
		}

		// If parent, scope to the linked children's leave records.
		// Backend pulls the union; query-string filters (status, dates,
		// requester_id) still apply, but requester_type is forced.
		var parentAllowed map[string]bool
		if ctx.Role == "parent" {
			parentAllowed = map[string]bool{}
			for _, id := range parentChildIDs {
				parentAllowed[id] = true
			}
			requesterType = "student"
			// If the parent passed an explicit requester_id, only allow
			// it if it's actually one of their kids — otherwise the
			// filter is silently zeroed so we never leak.
			if requesterID != "" && !parentAllowed[requesterID] {
				requesterID = ""
				parentAllowed = map[string]bool{"__none__": true}
			}
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

			// Filter by requester type and ID based on role
			switch ctx.Role {
			case "student":
				// Students see only their own leaves
				if l.RequesterType != requesterType || l.RequesterID != requesterID {
					continue
				}
			case "teacher":
				// Teachers see their own teacher leaves AND student leaves for their classes
				ownTeacherLeave := l.RequesterType == "teacher" && l.RequesterID == teacherOwnID
				studentLeaveForTheirClass := l.RequesterType == "student" && teacherClassIDs[l.ClassID]
				if !ownTeacherLeave && !studentLeaveForTheirClass {
					continue
				}
				// If requester_type or requester_id query params are set, apply them
				if requesterType != "" && l.RequesterType != requesterType {
					continue
				}
				if requesterID != "" && l.RequesterID != requesterID {
					continue
				}
			case "parent":
				// Parents see their linked children's leaves
				if !parentAllowed[l.RequesterID] {
					continue
				}
			default:
				// Admin or other roles with no restriction
				if requesterType != "" && l.RequesterType != requesterType {
					continue
				}
				if requesterID != "" && l.RequesterID != requesterID {
					continue
				}
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
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode leave records.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, leaveListCacheTTL)
	}
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

		// Parent is filing on behalf of a linked child. We accept an
		// explicit body.RequesterID (the parent picked a child) and
		// validate it against the StudentParents links; if missing we
		// fall back to the first linked child.
		//
		// Dev-seed compatibility: when no StudentParents links exist
		// for this parent, the rest of the parent portal
		// (dashboard / attendance / homework) already falls back to
		// "any student in the same tenant" via parent.resolveStudent.
		// We mirror that here so the parent portal's "viewable child"
		// set matches the "fileable-leave" set — otherwise the UI
		// shows the child everywhere but rejects the submission.
		if ctx.Role == "parent" {
			body.RequesterType = "student"
			h.Store.RLock()
			allowed := map[string]bool{}
			var firstChildID string
			hasLinks := false
			for _, link := range h.Store.StudentParents {
				if link.SchoolID == ctx.SchoolID && link.ParentUserID == ctx.UserID {
					hasLinks = true
					allowed[link.StudentID] = true
					if firstChildID == "" {
						firstChildID = link.StudentID
					}
				}
			}
			if !hasLinks {
				for _, s := range h.Store.Students {
					if s.SchoolID == ctx.SchoolID {
						allowed[s.ID] = true
						if firstChildID == "" {
							firstChildID = s.ID
						}
					}
				}
			}
			h.Store.RUnlock()

			if body.RequesterID == "" {
				body.RequesterID = firstChildID
			} else if !allowed[body.RequesterID] {
				return nil, api.NewControlledError(
					"FORBIDDEN",
					"You can only file leave for your own children.",
					403,
					nil,
				)
			}
			if body.RequesterID == "" {
				return nil, api.NewControlledError("NOT_FOUND", "No linked child found for this parent.", 404, nil)
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
		h.invalidateList(r, ctx.SchoolID)
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

		// For teachers, validate they can only update student leaves for their assigned classes
		var teacherClassIDs map[string]bool
		if ctx.Role == "teacher" {
			h.Store.RLock()
			for _, t := range h.Store.Teachers {
				if t.UserID == ctx.UserID && t.SchoolID == ctx.SchoolID {
					teacherClassIDs = make(map[string]bool)
					for _, cid := range t.ClassIDs {
						teacherClassIDs[cid] = true
					}
					break
				}
			}
			h.Store.RUnlock()
		}

		h.Store.Lock()
		defer h.Store.Unlock()
		for _, l := range h.Store.Leaves {
			if l.ID == id && l.SchoolID == ctx.SchoolID {
				// Teacher permission check: can only update student leaves for their assigned classes
				if ctx.Role == "teacher" {
					// Teachers can update their own teacher leaves OR student leaves for their classes
					isOwnTeacherLeave := l.RequesterType == "teacher" && l.RequesterID != "" && func() bool {
						for _, t := range h.Store.Teachers {
							if t.UserID == ctx.UserID {
								return t.ID == l.RequesterID
							}
						}
						return false
					}()
					isStudentLeaveForTheirClass := l.RequesterType == "student" && teacherClassIDs[l.ClassID]
					if !isOwnTeacherLeave && !isStudentLeaveForTheirClass {
						return nil, api.NewControlledError("FORBIDDEN", "You can only update leaves for your assigned classes.", 403, nil)
					}
				}

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
				h.invalidateList(r, ctx.SchoolID)
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
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Leave request not found.", 404, nil)
	}))
}
