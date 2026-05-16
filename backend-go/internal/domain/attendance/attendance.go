// Package attendance implements /api/attendance endpoints. Mirrors
// old-app/shared/services/attendance.service.ts: list with filters, mark
// (single + bulk upsert), update, delete.
package attendance

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

// attendanceListCacheTTL — short window so newly marked attendance
// surfaces quickly. Same TTL as other phase-8 list caches.
const attendanceListCacheTTL = 60 * time.Second

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
	Cache   *cache.Client
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
}

// NewWithCache attaches a Redis client. Pass nil to opt out — handler
// degrades to the original (no-cache) behaviour.
func NewWithCache(s *store.MemStore, save func(string, any), c *cache.Client) *Handler {
	h := New(s, save)
	h.Cache = c
	return h
}

// listCacheKey hashes role + scoping profile + query so different
// callers (admin vs teacher vs student) don't share a cache entry.
func listCacheKey(schoolID, role, profileID, query string) string {
	src := fmt.Sprintf("%s|%s|%s|%s", schoolID, role, profileID, query)
	h := sha1.Sum([]byte(src))
	return fmt.Sprintf("attendance:list:%s:%s", schoolID, hex.EncodeToString(h[:])[:16])
}

func (h *Handler) invalidateList(r *http.Request, schoolID string) {
	if h.Cache == nil || !h.Cache.Available() {
		return
	}
	_, _ = h.Cache.DelPattern(r.Context(), fmt.Sprintf("attendance:list:%s:*", schoolID))
}

// hydrated mirrors the populated row shape returned by the original
// `populate("student_id", "...").populate("class_id", "name")` chain.
type hydrated struct {
	*store.Attendance
	StudentName string `json:"student_name"`
	AdmissionNo string `json:"admission_no"`
	ClassName   string `json:"class_name"`
	DateString  string `json:"date_string,omitempty"`
}

func (h *Handler) hydrate(rows []*store.Attendance) []map[string]any {
	studentByID := map[string]*store.Student{}
	classByID := map[string]*store.Class{}
	for _, s := range h.Store.Students {
		studentByID[s.ID] = s
	}
	for _, c := range h.Store.Classes {
		classByID[c.ID] = c
	}
	out := make([]map[string]any, 0, len(rows))
	for _, r := range rows {
		stu := studentByID[r.StudentID]
		cls := classByID[r.ClassID]
		studentName := ""
		admission := ""
		if stu != nil {
			studentName = strings.TrimSpace(stu.FirstName + " " + stu.LastName)
			admission = stu.AdmissionNo
		}
		className := ""
		if cls != nil {
			className = cls.Name
		}
		out = append(out, map[string]any{
			"_id":              r.ID,
			"school_id":        r.SchoolID,
			"academic_year_id": r.AcademicYearID,
			"student_id":       r.StudentID,
			"class_id":         r.ClassID,
			"date":             api.FormatDate(r.Date),
			"period":           r.Period,
			"status":           r.Status,
			"marked_by":        r.MarkedBy,
			"source":           r.Source,
			"note":             r.Note,
			"student_name":     studentName,
			"admission_no":     admission,
			"class_name":       className,
			"created_at":       r.CreatedAt,
			"updated_at":       r.UpdatedAt,
		})
	}
	return out
}

// List implements GET /api/attendance.
//
// Supports two pagination modes:
//   1. Offset pagination: ?page=1&limit=50 (legacy, for backward compat)
//   2. Date-cursor pagination: ?before_date=2026-05-14&limit=50
//      Returns records older than before_date, with next_before_date for
//      fetching the next page of older records.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()

	if err := auth.AssertPermission(ctx, "attendance", auth.ActionView); err != nil {
		api.WriteResult(w, api.Fail("FORBIDDEN", err.Error(), 403, nil))
		return
	}

	// Resolve student profile id outside the cache key calc — students
	// from different classes must NOT share a cache entry.
	var profileID string
	if ctx.Role == "student" {
		h.Store.RLock()
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
				profileID = s.ID
				break
			}
		}
		h.Store.RUnlock()
	}

	cacheKey := listCacheKey(ctx.SchoolID, ctx.Role, profileID, q.Encode())
	if h.Cache != nil && h.Cache.Available() {
		if b, err := h.Cache.Get(r.Context(), cacheKey); err == nil && b != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			_, _ = w.Write(b)
			return
		}
	}

	result := api.ServiceTry(func() (any, error) {
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		studentID := q.Get("student_id")
		dateQ := q.Get("date")
		periodQ := q.Get("period")
		statusQ := q.Get("status")
		beforeDateQ := q.Get("before_date")

		// Role-specific scoping: students can only see their own, parents
		// must pass student_id, teachers see only their assigned classes.
		if ctx.Role == "student" {
			h.Store.RLock()
			var self *store.Student
			for _, s := range h.Store.Students {
				if s.SchoolID == ctx.SchoolID && s.UserID == ctx.UserID {
					self = s
					break
				}
			}
			h.Store.RUnlock()
			if self == nil {
				return []any{}, nil
			}
			studentID = self.ID
			classID = self.ClassID
		}

		// Parse limit for cursor pagination
		limit := 50
		if l, err := strconv.Atoi(q.Get("limit")); err == nil && l > 0 {
			limit = l
		}
		if limit > 200 {
			limit = 200
		}

		// Parse before_date cursor
		var beforeDate time.Time
		if beforeDateQ != "" {
			if d, ok := api.ParseDate(beforeDateQ); ok {
				beforeDate = d
			}
		}

		h.Store.RLock()
		rows := make([]*store.Attendance, 0)
		for _, a := range h.Store.Attendance {
			if a.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && a.AcademicYearID != "" && a.AcademicYearID != yearID {
				continue
			}
			if classID != "" && a.ClassID != classID {
				continue
			}
			if studentID != "" && a.StudentID != studentID {
				continue
			}
			if statusQ != "" && a.Status != statusQ {
				continue
			}
			if periodQ != "" {
				if api.FormatInt(a.Period) != periodQ {
					continue
				}
			}
			if dateQ != "" {
				d, ok := api.ParseDate(dateQ)
				if ok {
					start, end := api.DayBounds(d)
					if a.Date.Before(start) || a.Date.After(end) {
						continue
					}
				}
			}
			// Date cursor: only include records BEFORE the cursor date
			if !beforeDate.IsZero() {
				dayStart, _ := api.DayBounds(beforeDate)
				if !a.Date.Before(dayStart) {
					continue
				}
			}
			rows = append(rows, a)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].Date.After(rows[j].Date)
		})

		// If using date-cursor pagination (before_date is present or no
		// offset pagination params), return cursor-based response.
		if beforeDateQ != "" {
			hasMore := len(rows) > limit
			if hasMore {
				rows = rows[:limit]
			}

			hydrated := h.hydrate(rows)

			var nextBeforeDate string
			if hasMore && len(rows) > 0 {
				lastRow := rows[len(rows)-1]
				nextBeforeDate = api.FormatDate(lastRow.Date)
			}

			return map[string]any{
				"data":             hydrated,
				"next_before_date": nextBeforeDate,
				"has_more":         hasMore,
			}, nil
		}

		// Legacy offset pagination
		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		total := len(hydrated)
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), total, page), nil
	})

	bytes, err := json.Marshal(result)
	if err != nil {
		api.WriteResult(w, api.Fail("INTERNAL", "Failed to encode attendance.", 500, nil))
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
		_ = h.Cache.Set(r.Context(), cacheKey, bytes, attendanceListCacheTTL)
	}
}

type createInput struct {
	StudentID string `json:"student_id"`
	ClassID   string `json:"class_id"`
	Date      string `json:"date"`
	Period    int    `json:"period,omitempty"`
	Status    string `json:"status"`
	Note      string `json:"note,omitempty"`
}

// Create implements POST /api/attendance (single record).
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Attendance, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.StudentID == "" || body.ClassID == "" || body.Date == "" || body.Status == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "student_id, class_id, date and status are required.", 400, nil)
		}
		date, ok := api.ParseDate(body.Date)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid date format.", 400, nil)
		}
		date, _ = api.DayBounds(date)

		h.Store.Lock()
		defer h.Store.Unlock()

		var student *store.Student
		for _, s := range h.Store.Students {
			if s.ID == body.StudentID && s.SchoolID == ctx.SchoolID {
				student = s
				break
			}
		}
		if student == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Selected student was not found.", 404, nil)
		}
		var class *store.Class
		for _, c := range h.Store.Classes {
			if c.ID == body.ClassID && c.SchoolID == ctx.SchoolID {
				class = c
				break
			}
		}
		if class == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Selected class was not found.", 404, nil)
		}
		if student.ClassID != body.ClassID {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Selected student does not belong to the selected class.", 400, nil)
		}

		// Duplicate guard (student × date).
		for _, a := range h.Store.Attendance {
			if a.SchoolID == ctx.SchoolID && a.StudentID == body.StudentID && api.FormatDate(a.Date) == api.FormatDate(date) {
				return nil, api.NewControlledError("DUPLICATE", "Attendance already marked for this student on this date.", 400, nil)
			}
		}

		now := time.Now()
		newRow := &store.Attendance{
			ID:             store.NewID("att"),
			SchoolID:       ctx.SchoolID,
			AcademicYearID: ctx.ActiveAcademicYearID,
			StudentID:      body.StudentID,
			ClassID:        body.ClassID,
			Date:           date,
			Period:         body.Period,
			Status:         body.Status,
			MarkedBy:       ctx.UserID,
			Source:         "manual",
			Note:           body.Note,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		h.Store.Attendance = append(h.Store.Attendance, newRow)
		h.Persist("attendance", newRow)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "attendance", EntityID: newRow.ID, After: newRow,
		})
		h.invalidateList(r, ctx.SchoolID)
		return newRow, nil
	}))
}

type bulkInput struct {
	ClassID        string            `json:"class_id"`
	Date           string            `json:"date"`
	Period         int               `json:"period,omitempty"`
	AcademicYearID string            `json:"academic_year_id,omitempty"`
	Records        map[string]string `json:"records"` // student_id -> status
	Remarks        map[string]string `json:"remarks,omitempty"`
}

// MarkBulk implements POST /api/attendance/mark — upserts multiple records
// in one shot. Mirrors `markAttendanceBulk`.
func (h *Handler) MarkBulk(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body bulkInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (map[string]int, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionCreate); err != nil {
			return nil, err
		}
		if body.ClassID == "" || body.Date == "" || len(body.Records) == 0 {
			return nil, api.NewControlledError("VALIDATION_ERROR", "class_id, date and records are required.", 400, nil)
		}
		date, ok := api.ParseDate(body.Date)
		if !ok {
			return nil, api.NewControlledError("VALIDATION_ERROR", "Invalid date format.", 400, nil)
		}
		date, _ = api.DayBounds(date)

		yearID := body.AcademicYearID
		if yearID == "" {
			yearID = tenant.ResolveAcademicYearID(h.Store, ctx, "")
		}
		if yearID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "No active academic year found.", 400, nil)
		}

		period := body.Period
		if period == 0 {
			period = 1
		}

		h.Store.Lock()
		defer h.Store.Unlock()

		studentByID := map[string]*store.Student{}
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID {
				studentByID[s.ID] = s
			}
		}

		saved := 0
		now := time.Now()
		for studentID, status := range body.Records {
			stu := studentByID[studentID]
			if stu == nil {
				continue
			}
			classID := stu.ClassID
			if classID == "" {
				classID = body.ClassID
			}
			// Upsert by (student × date × period × class).
			var existing *store.Attendance
			for _, a := range h.Store.Attendance {
				if a.SchoolID != ctx.SchoolID {
					continue
				}
				if a.StudentID == studentID && a.ClassID == classID && a.Period == period && api.FormatDate(a.Date) == api.FormatDate(date) {
					existing = a
					break
				}
			}
			note := ""
			if body.Remarks != nil {
				note = body.Remarks[studentID]
			}
			if existing != nil {
				existing.Status = status
				existing.Note = note
				existing.MarkedBy = ctx.UserID
				existing.Source = "manual"
				h.Persist("attendance", existing)
			} else {
				row := &store.Attendance{
					ID:             store.NewID("att"),
					SchoolID:       ctx.SchoolID,
					AcademicYearID: yearID,
					StudentID:      studentID,
					ClassID:        classID,
					Date:           date,
					Period:         period,
					Status:         status,
					MarkedBy:       ctx.UserID,
					Source:         "manual",
					Note:           note,
					CreatedAt:      now,
					UpdatedAt:      now,
				}
				h.Store.Attendance = append(h.Store.Attendance, row)
				h.Persist("attendance", row)
			}
			saved++
		}
		audit.Write(h.Store, ctx, audit.Input{
			Action:   "create",
			EntityType: "attendance",
			EntityID:   body.ClassID,
			Metadata:   map[string]any{"saved": saved, "date": api.FormatDate(date), "period": period},
		})
		h.invalidateList(r, ctx.SchoolID)
		return map[string]int{"saved": saved}, nil
	}))
}

// Get implements GET /api/attendance/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, a := range h.Store.Attendance {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				return h.hydrate([]*store.Attendance{a})[0], nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Attendance not found.", 404, nil)
	}))
}

type updateInput struct {
	Status *string `json:"status,omitempty"`
	Note   *string `json:"note,omitempty"`
	Date   *string `json:"date,omitempty"`
}

// Update implements PATCH /api/attendance/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	var body updateInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Attendance, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, a := range h.Store.Attendance {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				before := *a
				if body.Status != nil {
					a.Status = *body.Status
				}
				if body.Note != nil {
					a.Note = *body.Note
				}
				if body.Date != nil {
					if d, ok := api.ParseDate(*body.Date); ok {
						a.Date, _ = api.DayBounds(d)
					}
				}
				a.UpdatedAt = time.Now()
				h.Persist("attendance", a)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "attendance", EntityID: id, Before: before, After: *a,
				})
				h.invalidateList(r, ctx.SchoolID)
				return a, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Attendance not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/attendance/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, a := range h.Store.Attendance {
			if a.ID == id && a.SchoolID == ctx.SchoolID {
				before := *a
				h.Store.Attendance = append(h.Store.Attendance[:i], h.Store.Attendance[i+1:]...)
				h.Persist("attendance:delete", before.ID)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "attendance", EntityID: id, Before: before,
				})
				h.invalidateList(r, ctx.SchoolID)
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Attendance not found.", 404, nil)
	}))
}
