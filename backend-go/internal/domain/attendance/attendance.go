// Package attendance implements /api/attendance endpoints. Mirrors
// old-app/shared/services/attendance.service.ts: list with filters, mark
// (single + bulk upsert), update, delete.
package attendance

import (
	"encoding/json"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/audit"
	"github.com/eduplexo/backend-go/internal/auth"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/go-chi/chi/v5"
)

type Handler struct {
	Store   *store.MemStore
	Persist func(table string, doc any)
}

func New(s *store.MemStore, save func(string, any)) *Handler {
	if save == nil {
		save = func(string, any) {}
	}
	return &Handler{Store: s, Persist: save}
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
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "attendance", auth.ActionView); err != nil {
			return nil, err
		}

		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))
		classID := q.Get("class_id")
		studentID := q.Get("student_id")
		dateQ := q.Get("date")
		periodQ := q.Get("period")
		statusQ := q.Get("status")

		// Role-specific scoping: students can only see their own, parents
		// must pass student_id, teachers see only their assigned classes.
		// Phase 2 doesn't yet model teacher↔class assignment outside the
		// Class.teacher_ids slice; we honor that.
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
			rows = append(rows, a)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].Date.After(rows[j].Date)
		})

		hydrated := h.hydrate(rows)
		page := api.ParsePagination(q)
		if !page.Enabled {
			return hydrated, nil
		}
		total := len(hydrated)
		return api.BuildPaginated(api.SafeSlice(hydrated, page.Skip, page.Skip+page.Limit), total, page), nil
	}))
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
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Attendance not found.", 404, nil)
	}))
}
