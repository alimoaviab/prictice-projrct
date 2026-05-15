// Package classes implements /api/classes endpoints. Mirrors
// old-app/shared/services/class.service.ts with the subset of fields the
// React frontend currently consumes.
package classes

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

// List implements GET /api/classes.
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, q.Get("academic_year_id"))

		h.Store.RLock()
		rows := make([]*store.Class, 0)

		// For teachers, resolve their teacher profile and filter to only
		// classes they're assigned to (as class teacher, or via teacher_classes
		// junction, or via timetable periods).
		var teacherProfile *store.Teacher
		if ctx.Role == "teacher" {
			for _, t := range h.Store.Teachers {
				if t.SchoolID == ctx.SchoolID && t.UserID == ctx.UserID {
					teacherProfile = t
					break
				}
			}
		}

		// Build a set of class IDs the teacher is assigned to.
		teacherClassIDs := map[string]bool{}
		if teacherProfile != nil {
			// From teacher.ClassIDs (junction table)
			for _, cid := range teacherProfile.ClassIDs {
				teacherClassIDs[cid] = true
			}
			// From timetable sessions where this teacher has periods
			for _, tt := range h.Store.Timetables {
				if tt.SchoolID != ctx.SchoolID {
					continue
				}
				for _, sess := range tt.Sessions {
					if sess.TeacherID == teacherProfile.ID {
						teacherClassIDs[tt.ClassID] = true
						break
					}
				}
			}
		}

		for _, c := range h.Store.Classes {
			if c.SchoolID != ctx.SchoolID {
				continue
			}
			if yearID != "" && c.AcademicYearID != yearID {
				continue
			}
			// Teacher scoping: only show assigned classes.
			if teacherProfile != nil {
				isAssigned := teacherClassIDs[c.ID] || c.ClassTeacherID == teacherProfile.ID
				if !isAssigned {
					continue
				}
			}
			rows = append(rows, c)
		}
		h.Store.RUnlock()
		
		// Enrich classes with stats before returning
		h.Store.RLock()
		for _, c := range rows {
			h.enrichClass(c)
		}
		h.Store.RUnlock()

		sort.SliceStable(rows, func(i, j int) bool {
			return rows[i].Name < rows[j].Name
		})

		page := api.ParsePagination(q)
		if !page.Enabled {
			// Always return paginated shape for consistency
			total := len(rows)
			return map[string]any{
				"data": rows,
				"meta": map[string]any{
					"total": total,
					"page":  1,
					"limit": total,
					"pages": 1,
				},
			}, nil
		}
		total := len(rows)
		start := page.Skip
		end := start + page.Limit
		if start > total {
			start = total
		}
		if end > total {
			end = total
		}
		pages := total / page.Limit
		if total%page.Limit != 0 {
			pages++
		}
		if pages < 1 {
			pages = 1
		}
		return map[string]any{
			"data": rows[start:end],
			"meta": map[string]any{
				"total": total,
				"page":  page.Page,
				"limit": page.Limit,
				"pages": pages,
			},
		}, nil
	}))
}

// Get implements GET /api/classes/:id.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				h.enrichClass(c)
				return c, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

// GetSubjects implements GET /api/classes/:id/subjects.
func (h *Handler) GetSubjects(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionView); err != nil {
			return nil, err
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		for _, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				// We return the same shape as expected by the frontend: { subjects: [...] }
				// If c.Subjects is nil, we return an empty slice to avoid null in JSON.
				subs := c.Subjects
				if subs == nil {
					subs = []store.ClassSubject{}
				}
				return map[string]any{"subjects": subs}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

type createInput struct {
	Name              string   `json:"name"`
	Code              string   `json:"code"`
	Grade             string   `json:"grade"`
	Section           string   `json:"section"`
	Capacity          int      `json:"capacity"`
	PassingPercentage int      `json:"passing_percentage"`
	ClassTeacherID    string   `json:"class_teacher_id,omitempty"`
	TeacherIDs        []string `json:"teacher_ids,omitempty"`
	SubjectIDs        []string               `json:"subject_ids,omitempty"`
	Subjects          []store.ClassSubject   `json:"subjects,omitempty"`
	GradeThresholds   []store.GradeThreshold `json:"grade_thresholds,omitempty"`
	RoomNumber        string                 `json:"room_number,omitempty"`
	Description       string                 `json:"description,omitempty"`
	AcademicYearID    string                 `json:"academic_year_id,omitempty"`
}

// Create implements POST /api/classes.
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	var body createInput
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Class, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionCreate); err != nil {
			return nil, err
		}
		if strings.TrimSpace(body.Name) == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "name is required.", 400, nil)
		}
		yearID := body.AcademicYearID
		if yearID == "" {
			yearID = tenant.ResolveAcademicYearID(h.Store, ctx, "")
		}
		if yearID == "" {
			return nil, api.NewControlledError("VALIDATION_ERROR", "No active academic year found for this school.", 400, nil)
		}
		now := time.Now()
		newClass := &store.Class{
			ID:                store.NewID("cls"),
			SchoolID:          ctx.SchoolID,
			AcademicYearID:    yearID,
			Name:              body.Name,
			Code:              body.Code,
			Grade:             body.Grade,
			Section:           body.Section,
			Capacity:          body.Capacity,
			PassingPercentage: body.PassingPercentage,
			ClassTeacherID:    body.ClassTeacherID,
			TeacherIDs:        body.TeacherIDs,
			SubjectIDs:        body.SubjectIDs,
			Subjects:          body.Subjects,
			GradeThresholds:   body.GradeThresholds,
			RoomNumber:        body.RoomNumber,
			Description:       body.Description,
			Status:            "active",
			CreatedAt:         now,
			UpdatedAt:         now,
		}
		h.Store.Lock()
		h.Store.Classes = append(h.Store.Classes, newClass)
		h.Store.Unlock()
		h.Persist("classes", newClass)

		audit.Write(h.Store, ctx, audit.Input{
			Action: "create", EntityType: "class", EntityID: newClass.ID, After: newClass,
		})
		return newClass, nil
	}))
}

// Update implements PATCH /api/classes/:id.
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	body := map[string]json.RawMessage{}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		api.WriteResult(w, api.Fail("VALIDATION_ERROR", "Invalid JSON body.", 400, nil))
		return
	}
	api.WriteResult(w, api.ServiceTry(func() (*store.Class, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionUpdate); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for _, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				before := *c
				if v, ok := body["name"]; ok {
					_ = json.Unmarshal(v, &c.Name)
				}
				if v, ok := body["code"]; ok {
					_ = json.Unmarshal(v, &c.Code)
				}
				if v, ok := body["grade"]; ok {
					_ = json.Unmarshal(v, &c.Grade)
				}
				if v, ok := body["section"]; ok {
					_ = json.Unmarshal(v, &c.Section)
				}
				if v, ok := body["capacity"]; ok {
					_ = json.Unmarshal(v, &c.Capacity)
				}
				if v, ok := body["passing_percentage"]; ok {
					_ = json.Unmarshal(v, &c.PassingPercentage)
				}
				if v, ok := body["class_teacher_id"]; ok {
					_ = json.Unmarshal(v, &c.ClassTeacherID)
				}
				if v, ok := body["teacher_ids"]; ok {
					_ = json.Unmarshal(v, &c.TeacherIDs)
				}
				if v, ok := body["subject_ids"]; ok {
					_ = json.Unmarshal(v, &c.SubjectIDs)
				}
				if v, ok := body["subjects"]; ok {
					_ = json.Unmarshal(v, &c.Subjects)
				}
				if v, ok := body["grade_thresholds"]; ok {
					_ = json.Unmarshal(v, &c.GradeThresholds)
				}
				if v, ok := body["room_number"]; ok {
					_ = json.Unmarshal(v, &c.RoomNumber)
				}
				if v, ok := body["description"]; ok {
					_ = json.Unmarshal(v, &c.Description)
				}
				if v, ok := body["status"]; ok {
					_ = json.Unmarshal(v, &c.Status)
				}
				c.UpdatedAt = time.Now()
				h.Persist("classes", c)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "update", EntityType: "class", EntityID: id,
					Before: before, After: *c,
				})
				return c, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

// Delete implements DELETE /api/classes/:id.
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	id := chi.URLParam(r, "id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if err := auth.AssertPermission(ctx, "classes", auth.ActionDelete); err != nil {
			return nil, err
		}
		h.Store.Lock()
		defer h.Store.Unlock()
		for i, c := range h.Store.Classes {
			if c.ID == id && c.SchoolID == ctx.SchoolID {
				before := *c
				h.Store.Classes = append(h.Store.Classes[:i], h.Store.Classes[i+1:]...)
				h.Persist("classes:delete", before.ID)
				audit.Write(h.Store, ctx, audit.Input{
					Action: "delete", EntityType: "class", EntityID: id, Before: before,
				})
				return map[string]any{"success": true, "id": id}, nil
			}
		}
		return nil, api.NewControlledError("NOT_FOUND", "Class not found.", 404, nil)
	}))
}

func (h *Handler) enrichClass(c *store.Class) {
	// 1. Calculate StudentCount
	count := 0
	for _, s := range h.Store.Students {
		if s.ClassID == c.ID {
			count++
		}
	}
	c.StudentCount = count
	c.EnrolledStudents = count

	// 2. Hydrate ClassTeacher reference
	if c.ClassTeacherID != "" {
		for _, t := range h.Store.Teachers {
			if t.ID == c.ClassTeacherID {
				c.ClassTeacher = &store.ClassTeacherRef{
					ID:    t.ID,
					Name:  strings.TrimSpace(t.FirstName + " " + t.LastName),
					Phone: t.Phone,
				}
				break
			}
		}
	}

	// 3. Hydrate TeacherNames from TeacherIDs
	if len(c.TeacherIDs) > 0 {
		names := make([]string, 0, len(c.TeacherIDs))
		for _, tid := range c.TeacherIDs {
			for _, t := range h.Store.Teachers {
				if t.ID == tid {
					names = append(names, strings.TrimSpace(t.FirstName+" "+t.LastName))
					break
				}
			}
		}
		c.TeacherNames = names
	}

	// 4. Calculate AttendancePercentage
	dates := make(map[string]bool)
	presentCount := 0
	for _, a := range h.Store.Attendance {
		if a.ClassID == c.ID {
			dates[api.FormatDate(a.Date)] = true
			if strings.ToLower(a.Status) == "present" {
				presentCount++
			}
		}
	}
	numDates := len(dates)
	if numDates > 0 && c.StudentCount > 0 {
		totalPossible := numDates * c.StudentCount
		c.AttendancePercentage = float64(presentCount) / float64(totalPossible) * 100
	} else {
		c.AttendancePercentage = 0
	}

	// 5. Calculate FeeStatus
	totalDue := 0.0
	totalPaid := 0.0

	studentIDs := make(map[string]bool)
	for _, s := range h.Store.Students {
		if s.ClassID == c.ID {
			studentIDs[s.ID] = true
		}
	}

	for _, f := range h.Store.Fees {
		if studentIDs[f.StudentID] && f.Status != "void" {
			totalDue += (f.Amount + f.AdjustmentAmount)
			totalPaid += f.PaidAmount
		}
	}

	if totalDue > 0 {
		c.FeeStatus = (totalPaid / totalDue) * 100
	} else {
		c.FeeStatus = 0
	}
}
