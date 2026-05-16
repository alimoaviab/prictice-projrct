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
//
// Response shape — matches the parent dashboard page's expectation:
//
//	{
//	  dashboard: {
//	    children_overview: [
//	      {
//	        student_id, name, class, current_grade,
//	        attendance_percentage, pending_fees, pending_assignments
//	      }
//	    ]
//	  },
//	  // The legacy fields below are still emitted for any older
//	  // consumer that hasn't migrated to children_overview yet.
//	  attendance, upcomingExams, recentResults, feeDue
//	}
func (h *Handler) DashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		attendance := map[string]any{"present": 0, "total": 0, "percentage": 0}
		exams := []map[string]any{}
		results := []map[string]any{}
		feeDue := map[string]any{"amount": 0, "due_date": nil}

		emptyOverview := map[string]any{
			"student_id":            "",
			"name":                  "",
			"class":                 "",
			"current_grade":         "—",
			"attendance_percentage": 0,
			"pending_fees":          0,
			"pending_assignments":   0,
		}
		if s == nil {
			return map[string]any{
				"dashboard": map[string]any{
					"children_overview": []map[string]any{emptyOverview},
				},
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
		// Outstanding fees for the student.
		var pendingFees float64
		for _, f := range h.Store.Fees {
			if f.SchoolID != ctx.SchoolID || f.StudentID != s.ID {
				continue
			}
			eff := f.Amount + f.AdjustmentAmount
			out := eff - f.PaidAmount
			if out > 0 {
				pendingFees += out
			}
		}
		// Pending homework: assigned to the student's class & section
		// and not in draft.
		pendingHomework := 0
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
			// Count if the student hasn't submitted yet.
			submitted := false
			for _, sub := range hw.Submissions {
				if sub.StudentID == s.ID && (sub.Status == "submitted" || sub.Status == "graded") {
					submitted = true
					break
				}
			}
			if !submitted {
				pendingHomework++
			}
		}
		// Class name for the overview card.
		className := ""
		for _, c := range h.Store.Classes {
			if c.ID == s.ClassID {
				className = c.Name
				if s.Section != "" {
					className += " - " + s.Section
				}
				break
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
		// Most recent grade letter from the latest result, derived from
		// the per-exam max-marks. Falls back to "—" when the student
		// has no graded results yet.
		currentGrade := "—"
		if len(resRows) > 0 {
			latest := resRows[0]
			max := 0
			for _, e := range h.Store.Exams {
				if e.ID == latest.ExamID {
					if len(e.Subjects) > 0 {
						for _, sub := range e.Subjects {
							max += sub.MaxMarks
						}
					} else {
						max = e.MaxMarks
					}
					break
				}
			}
			if max > 0 {
				pct := (latest.ObtainedMarks / float64(max)) * 100
				switch {
				case pct >= 90:
					currentGrade = "A+"
				case pct >= 80:
					currentGrade = "A"
				case pct >= 70:
					currentGrade = "B"
				case pct >= 60:
					currentGrade = "C"
				case pct >= 50:
					currentGrade = "D"
				default:
					currentGrade = "F"
				}
			}
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
		feeDue = map[string]any{"amount": pendingFees, "due_date": nil}

		overview := map[string]any{
			"student_id":            s.ID,
			"name":                  s.FirstName + " " + s.LastName,
			"class":                 className,
			"current_grade":         currentGrade,
			"attendance_percentage": percentage,
			"pending_fees":          pendingFees,
			"pending_assignments":   pendingHomework,
		}

		return map[string]any{
			"dashboard": map[string]any{
				"children_overview": []map[string]any{overview},
			},
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
			subjectsOut := make([]map[string]any, 0)
			if ex != nil {
				title = ex.Title
				// New architecture: aggregate max from exam.Subjects[],
				// fall back to legacy MaxMarks for older rows.
				if len(ex.Subjects) > 0 {
					for _, s := range ex.Subjects {
						max += s.MaxMarks
					}
					// Joined display string for legacy widgets.
					for i, s := range ex.Subjects {
						if i > 0 {
							subject += ", "
						}
						subject += s.SubjectName
					}
				} else {
					max = ex.MaxMarks
					subject = ex.Subject
				}
			}
			// Per-subject breakdown — pair the result subjects with the
			// exam's per-subject max so the parent UI can render one
			// chip per subject just like the admin/teacher views.
			examSubByID := map[string]store.ExamSubject{}
			if ex != nil {
				for _, es := range ex.Subjects {
					examSubByID[es.SubjectID] = es
				}
			}
			for _, rs := range r.Subjects {
				meta := examSubByID[rs.SubjectID]
				name := rs.SubjectName
				if name == "" {
					name = meta.SubjectName
				}
				subjectsOut = append(subjectsOut, map[string]any{
					"subject_id":     rs.SubjectID,
					"subject_name":   name,
					"obtained_marks": rs.ObtainedMarks,
					"max_marks":      meta.MaxMarks,
				})
			}
			out = append(out, map[string]any{
				"_id":            r.ID,
				"exam_id":        r.ExamID,
				"exam_title":     title,
				"exam_subject":   subject,
				"subjects":       subjectsOut,
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
//
// Response shape — matches the parent attendance page:
//
//	{
//	  student, class,
//	  attendance_summary: {
//	    present_days, absent_days, late_days, leave_days,
//	    total_days, attendance_percentage
//	  },
//	  recent_records: [{ date, status, period, note }]
//	}
//
// We keep responding with a top-level object — the previous bare array
// shape was never consumed by the frontend (the page expected
// `recent_records` and crashed silently).
func (h *Handler) StudentAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	studentID := r.URL.Query().Get("student_id")
	api.WriteResult(w, api.ServiceTry(func() (any, error) {
		s := h.resolveStudent(ctx, studentID)
		empty := map[string]any{
			"student": "",
			"class":   "",
			"attendance_summary": map[string]any{
				"present_days":          0,
				"absent_days":           0,
				"late_days":             0,
				"leave_days":            0,
				"total_days":            0,
				"attendance_percentage": 0,
			},
			"recent_records": []map[string]any{},
		}
		if s == nil {
			return empty, nil
		}
		h.Store.RLock()
		defer h.Store.RUnlock()

		records := make([]map[string]any, 0)
		var present, absent, late, leave int
		// Group by date so a single school day counts as one record
		// even when attendance was marked across multiple periods.
		byDate := map[string][]*store.Attendance{}
		for _, a := range h.Store.Attendance {
			if a.SchoolID != ctx.SchoolID || a.StudentID != s.ID {
				continue
			}
			date := api.FormatDate(a.Date)
			byDate[date] = append(byDate[date], a)
		}
		for date, arr := range byDate {
			// Status priority: present > late > leave > absent. Any
			// "present" period across the day means present.
			status := "absent"
			period := 0
			note := ""
			for _, a := range arr {
				if a.Status == "present" {
					status = "present"
				} else if a.Status == "late" && status != "present" {
					status = "late"
				} else if a.Status == "leave" && status != "present" && status != "late" {
					status = "leave"
				}
				if a.Period > period {
					period = a.Period
				}
				if a.Note != "" {
					note = a.Note
				}
			}
			switch status {
			case "present":
				present++
			case "absent":
				absent++
			case "late":
				late++
			case "leave":
				leave++
			}
			records = append(records, map[string]any{
				"date":   date,
				"status": status,
				"period": period,
				"note":   note,
			})
		}
		sort.SliceStable(records, func(i, j int) bool {
			return records[i]["date"].(string) > records[j]["date"].(string)
		})
		// Cap recent records — the page only renders the latest activity.
		recent := records
		if len(recent) > 30 {
			recent = recent[:30]
		}

		total := present + absent + late + leave
		percentage := 0
		if total > 0 {
			// Late counts as half-attendance for the percentage to
			// match the rest of the system's calculation.
			percentage = ((present*2 + late) * 50) / total
		}

		className := ""
		for _, c := range h.Store.Classes {
			if c.ID == s.ClassID {
				className = c.Name
				if s.Section != "" {
					className += " - " + s.Section
				}
				break
			}
		}

		return map[string]any{
			"student": s.FirstName + " " + s.LastName,
			"class":   className,
			"attendance_summary": map[string]any{
				"present_days":          present,
				"absent_days":           absent,
				"late_days":             late,
				"leave_days":            leave,
				"total_days":            total,
				"attendance_percentage": percentage,
			},
			"recent_records": recent,
		}, nil
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
