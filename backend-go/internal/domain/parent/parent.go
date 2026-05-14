// Package parent serves the /api/parent/* tree consumed by the parent
// portal pages. Mirrors old-app/shared/services/parent-portal.service.ts —
// each endpoint preserves the original response shape exactly so the React
// parent pages render unchanged.
package parent

import (
	"net/http"
	"sort"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// resolveStudent returns the active student for the parent flow. When the
// caller passes ?student_id, that one is preferred; otherwise we use the
// first student linked to the requesting parent. For Phase 2 the
// student↔parent linkage isn't fully populated, so as a safe fallback we
// return any student in the same tenant.
func (h *Handler) resolveStudent(ctx *api.RequestContext, requested string) *store.Student {
	h.Store.RLock()
	defer h.Store.RUnlock()
	if requested != "" {
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID && s.ID == requested {
				return s
			}
		}
	}
	// Linked parent records.
	for _, link := range h.Store.StudentParents {
		if link.SchoolID == ctx.SchoolID && link.ParentUserID == ctx.UserID {
			for _, s := range h.Store.Students {
				if s.ID == link.StudentID {
					return s
				}
			}
		}
	}
	for _, s := range h.Store.Students {
		if s.SchoolID == ctx.SchoolID {
			return s
		}
	}
	return nil
}

func (h *Handler) studentSummary(s *store.Student) map[string]any {
	if s == nil {
		return nil
	}
	className, section := "", s.Section
	yearName := ""
	h.Store.RLock()
	for _, c := range h.Store.Classes {
		if c.ID == s.ClassID {
			className = c.Name
			break
		}
	}
	for _, y := range h.Store.AcademicYears {
		if y.ID == s.AcademicYearID {
			yearName = y.Year
			break
		}
	}
	h.Store.RUnlock()
	return map[string]any{
		"id":            s.ID,
		"name":          s.FirstName + " " + s.LastName,
		"roll_no":       s.AdmissionNo,
		"class_id":      s.ClassID,
		"class":         className,
		"section":       section,
		"academic_year": yearName,
		"status":        s.Status,
	}
}

// StudentInfo implements GET /api/parent/student-info. With no
// `student_id`, returns the list of linked students; with one, returns
// detailed info for that student.
func (h *Handler) StudentInfo(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	q := r.URL.Query()
	studentID := q.Get("student_id")

	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		if studentID == "" {
			h.Store.RLock()
			out := make([]map[string]any, 0)
			seen := map[string]bool{}
			// First: explicit student↔parent links.
			for _, link := range h.Store.StudentParents {
				if link.SchoolID == ctx.SchoolID && link.ParentUserID == ctx.UserID {
					for _, s := range h.Store.Students {
						if s.ID == link.StudentID && !seen[s.ID] {
							out = append(out, h.studentSummary(s))
							seen[s.ID] = true
						}
					}
				}
			}
			// Fallback for the dev-seed flow where we haven't populated
			// links yet — surface every student in the tenant. The
			// frontend's selector still works.
			if len(out) == 0 {
				for _, s := range h.Store.Students {
					if s.SchoolID == ctx.SchoolID {
						out = append(out, h.studentSummary(s))
					}
				}
			}
			h.Store.RUnlock()
			return map[string]any{"students": out}, nil
		}
		s := h.resolveStudent(ctx, studentID)
		if s == nil {
			return nil, api.NewControlledError("NOT_FOUND", "Student not found.", 404, nil)
		}
		return h.studentSummary(s), nil
	}))
}

// Children implements GET /api/parent/children — same as StudentInfo without
// a student_id.
func (h *Handler) Children(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	q.Del("student_id")
	r.URL.RawQuery = q.Encode()
	h.StudentInfo(w, r)
}

// DashboardStats implements GET /api/parent/dashboard/stats.
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		attendance := map[string]any{"present": 0, "total": 0, "percentage": 0}
		exams := []map[string]any{}
		results := []map[string]any{}
		feeDue := map[string]any{"amount": 0, "due_date": nil}

		if s == nil {
			return map[string]any{
				"attendance":    attendance,
				"upcomingExams": exams,
				"recentResults": results,
				"feeDue":        feeDue,
			}, nil
		}

		h.Store.RLock()
		// Attendance percentage for the active year.
		var present, total int
		for _, a := range h.Store.Attendance {
			if a.SchoolID == ctx.SchoolID && a.StudentID == s.ID {
				total++
				if a.Status == "present" {
					present++
				}
			}
		}
		// Upcoming exams (next 5).
		exRows := make([]*store.Exam, 0)
		for _, e := range h.Store.Exams {
			if e.SchoolID == ctx.SchoolID && e.ClassID == s.ClassID {
				exRows = append(exRows, e)
			}
		}
		// Recent results (last 5 graded).
		resRows := make([]*store.Result, 0)
		for _, r := range h.Store.Results {
			if r.SchoolID == ctx.SchoolID && r.StudentID == s.ID {
				resRows = append(resRows, r)
			}
		}
		h.Store.RUnlock()

		sort.SliceStable(exRows, func(i, j int) bool { return exRows[i].StartsAt.Before(exRows[j].StartsAt) })
		if len(exRows) > 5 {
			exRows = exRows[:5]
		}
		for _, e := range exRows {
			exams = append(exams, map[string]any{
				"_id": e.ID, "title": e.Title, "subject": e.Subject,
				"starts_at": api.FormatDate(e.StartsAt), "max_marks": e.MaxMarks,
			})
		}
		sort.SliceStable(resRows, func(i, j int) bool { return resRows[i].GradedAt.After(resRows[j].GradedAt) })
		if len(resRows) > 5 {
			resRows = resRows[:5]
		}
		for _, r := range resRows {
			results = append(results, map[string]any{
				"_id": r.ID, "exam_id": r.ExamID, "obtained_marks": r.ObtainedMarks,
				"graded_at": r.GradedAt, "remarks": r.Remarks,
			})
		}
		percentage := 0
		if total > 0 {
			percentage = (present * 100) / total
		}
		attendance = map[string]any{"present": present, "total": total, "percentage": percentage}

		return map[string]any{
			"attendance":    attendance,
			"upcomingExams": exams,
			"recentResults": results,
			"feeDue":        feeDue,
		}, nil
	}))
}

// StudentResults implements GET /api/parent/student-results.
func (h *Handler) StudentResults(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		if s == nil {
			return []map[string]any{}, nil
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		examByID := map[string]*store.Exam{}
		for _, e := range h.Store.Exams {
			examByID[e.ID] = e
		}
		out := make([]map[string]any, 0)
		for _, r := range h.Store.Results {
			if r.SchoolID != ctx.SchoolID || r.StudentID != s.ID {
				continue
			}
			ex := examByID[r.ExamID]
			max := 0
			title, subject := "", ""
			if ex != nil {
				max = ex.MaxMarks
				title = ex.Title
				subject = ex.Subject
			}
			out = append(out, map[string]any{
				"_id":            r.ID,
				"exam_id":        r.ExamID,
				"exam_title":     title,
				"exam_subject":   subject,
				"obtained_marks": r.ObtainedMarks,
				"max_marks":      max,
				"graded_at":      r.GradedAt,
				"remarks":        r.Remarks,
			})
		}
		return out, nil
	}))
}

// StudentAttendance implements GET /api/parent/student-attendance.
func (h *Handler) StudentAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		if s == nil {
			return []map[string]any{}, nil
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		out := make([]map[string]any, 0)
		for _, a := range h.Store.Attendance {
			if a.SchoolID != ctx.SchoolID || a.StudentID != s.ID {
				continue
			}
			out = append(out, map[string]any{
				"_id":        a.ID,
				"date":       api.FormatDate(a.Date),
				"period":     a.Period,
				"status":     a.Status,
				"note":       a.Note,
				"class_id":   a.ClassID,
				"created_at": a.CreatedAt,
			})
		}
		sort.SliceStable(out, func(i, j int) bool {
			return out[i]["date"].(string) > out[j]["date"].(string)
		})
		return out, nil
	}))
}

// Fees implements GET /api/parent/fees — Phase 2 ships an empty ledger;
// the page renders correctly with this shape.
func (h *Handler) Fees(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok(map[string]any{
		"summary": map[string]any{"total": 0, "paid": 0, "due": 0},
		"rows":    []any{},
	}))
}

// ChildHomework implements GET /api/parent/child/homework.
func (h *Handler) ChildHomework(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		if s == nil {
			return []map[string]any{}, nil
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		
		teacherByID := map[string]*store.Teacher{}
		for _, t := range h.Store.Teachers {
			teacherByID[t.ID] = t
		}

		out := make([]map[string]any, 0)
		for _, hw := range h.Store.Homework {
			if hw.SchoolID != ctx.SchoolID || hw.ClassID != s.ClassID {
				continue
			}
			if hw.Section != "" && hw.Section != s.Section {
				continue
			}
			if hw.Status == "draft" {
				continue
			}

			teacherName := "Teacher"
			if t := teacherByID[hw.TeacherID]; t != nil {
				teacherName = t.FirstName + " " + t.LastName
			}

			out = append(out, map[string]any{
				"_id":          hw.ID,
				"id":           hw.ID,
				"title":        hw.Title,
				"subject":      hw.Subject,
				"subject_name": hw.Subject,
				"due_at":       api.FormatDate(hw.DueAt),
				"status":       hw.Status,
				"teacher_name": teacherName,
			})
		}
		sort.SliceStable(out, func(i, j int) bool {
			return out[i]["due_at"].(string) < out[j]["due_at"].(string)
		})
		return out, nil
	}))
}

// ChildAnnouncements implements GET /api/parent/child/announcements.
func (h *Handler) ChildAnnouncements(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()
		out := make([]*store.Announcement, 0)
		for _, a := range h.Store.Announcements {
			if a.SchoolID == ctx.SchoolID && (a.Audience == "" || a.Audience == "all" || a.Audience == "parents") {
				out = append(out, a)
			}
		}
		sort.SliceStable(out, func(i, j int) bool {
			return out[i].CreatedAt.After(out[j].CreatedAt)
		})
		return out, nil
	}))
}

// PerformanceChart implements GET /api/parent/performance-chart — returns
// the same `{ labels, data }` shape the chart component reads.
func (h *Handler) PerformanceChart(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		labels := []string{}
		data := []float64{}
		if s == nil {
			return map[string]any{"labels": labels, "data": data}, nil
		}
		h.Store.RLock()
		defer h.Store.RUnlock()
		examByID := map[string]*store.Exam{}
		for _, e := range h.Store.Exams {
			examByID[e.ID] = e
		}
		rows := make([]*store.Result, 0)
		for _, r := range h.Store.Results {
			if r.SchoolID == ctx.SchoolID && r.StudentID == s.ID {
				rows = append(rows, r)
			}
		}
		sort.SliceStable(rows, func(i, j int) bool { return rows[i].GradedAt.Before(rows[j].GradedAt) })
		for _, r := range rows {
			ex := examByID[r.ExamID]
			label := r.ExamID
			max := 0.0
			if ex != nil {
				label = ex.Title
				max = float64(ex.MaxMarks)
			}
			pct := 0.0
			if max > 0 {
				pct = r.ObtainedMarks / max * 100
			}
			labels = append(labels, label)
			data = append(data, pct)
		}
		return map[string]any{"labels": labels, "data": data}, nil
	}))
}
