// Package dashboard implements /api/analytics/dashboard. Mirrors the
// `getOverviewStats` shape from old-app/shared/services/dashboard-analytics.service.ts
// and reuses the same overall response envelope the original Node route
// returns to the frontend.
//
// Phase 2 produces values from the in-memory store. Counters that depend on
// data not yet ported (attendance, exams, fees, leave) return zeros; the
// shape and field names are preserved verbatim so the frontend renders.
package dashboard

import (
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
)

type Handler struct{ Store *store.MemStore }

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

type overview struct {
	TotalStudents      int                    `json:"totalStudents"`
	TotalTeachers      int                    `json:"totalTeachers"`
	TotalClasses       int                    `json:"totalClasses"`
	AttendanceToday    int                    `json:"attendanceToday"`
	AttendanceDetailed map[string]int         `json:"attendanceDetailed"`
	ActiveExams        int                    `json:"activeExams"`
	PendingLeave       int                    `json:"pendingLeave"`
	UnmarkedStudents   int                    `json:"unmarkedStudents"`
	FeeCollection      map[string]int         `json:"feeCollection"`
}

type response struct {
	Overview        overview                 `json:"overview"`
	Trends          []map[string]any         `json:"trends"`
	Alerts          []map[string]any         `json:"alerts"`
	ClassAttendance []map[string]any         `json:"classAttendance"`
	Activities      []map[string]any         `json:"activities"`
}

// Get implements GET /api/analytics/dashboard.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	api.WriteResult(w, api.ServiceTry(func() (response, error) {
		yearID := tenant.ResolveAcademicYearID(h.Store, ctx, r.URL.Query().Get("academic_year_id"))

		h.Store.RLock()
		defer h.Store.RUnlock()

		var (
			students int
			teachers int
			classes  int
		)
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID {
				// Only count students for the active academic year if it exists
				if yearID != "" && s.AcademicYearID != yearID {
					continue
				}
				if s.Status == "active" {
					students++
				}
			}
		}
		for _, t := range h.Store.Teachers {
			if t.SchoolID == ctx.SchoolID {
				// Teachers are generally school-wide but might be scoped by year in some deployments
				if yearID != "" && t.AcademicYearID != "" && t.AcademicYearID != yearID {
					continue
				}
				if t.Status == "active" {
					teachers++
				}
			}
		}
		for _, c := range h.Store.Classes {
			if c.SchoolID == ctx.SchoolID {
				if yearID != "" && c.AcademicYearID != yearID {
					continue
				}
				if c.Status != "archived" {
					classes++
				}
			}
		}

		// Recent activity: last 10 audit log entries for this tenant.
		auditRows := make([]*store.AuditLog, 0)
		for _, a := range h.Store.AuditLogs {
			if a.SchoolID == ctx.SchoolID {
				auditRows = append(auditRows, a)
			}
		}
		sort.SliceStable(auditRows, func(i, j int) bool {
			return auditRows[i].CreatedAt.After(auditRows[j].CreatedAt)
		})
		if len(auditRows) > 10 {
			auditRows = auditRows[:10]
		}
		activities := make([]map[string]any, 0, len(auditRows))
		for _, a := range auditRows {
			activities = append(activities, map[string]any{
				"_id":         a.ID,
				"action":      a.Action,
				"entity_type": a.EntityType,
				"actor_email": a.ActorEmail,
				"created_at":  a.CreatedAt,
			})
		}

		// Attendance Today
		var present, absent int
		todayStart, todayEnd := api.DayBounds(time.Now())

		// Map to keep track of unique students marked today
		markedStudents := make(map[string]bool)

		for _, a := range h.Store.Attendance {
			if a.SchoolID == ctx.SchoolID && !a.Date.Before(todayStart) && !a.Date.After(todayEnd) {
				if yearID != "" && a.AcademicYearID != "" && a.AcademicYearID != yearID {
					continue
				}
				if markedStudents[a.StudentID] {
					continue // Only count first marking for the day (e.g. Period 1)
				}
				markedStudents[a.StudentID] = true
				switch strings.ToLower(a.Status) {
				case "present", "late", "excused":
					present++
				case "absent":
					absent++
				}
			}
		}

		// Exams & Leave Scoping
		activeExams := 0
		for _, e := range h.Store.Exams {
			if e.SchoolID == ctx.SchoolID && (yearID == "" || e.AcademicYearID == yearID) {
				if e.Status == "scheduled" || e.Status == "active" {
					activeExams++
				}
			}
		}

		pendingLeave := 0
		for _, l := range h.Store.Leaves {
			if l.SchoolID == ctx.SchoolID && l.Status == "pending" {
				pendingLeave++
			}
		}

		// Fee Collection Aggregation
		var totalAmount, paidAmount float64
		pendingFeesCount := 0
		for _, f := range h.Store.Fees {
			if f.SchoolID == ctx.SchoolID && (yearID == "" || f.AcademicYearID == yearID) {
				effective := f.Amount + f.AdjustmentAmount
				totalAmount += effective
				paidAmount += f.PaidAmount
				if f.PaidAmount < effective && f.Status != "void" {
					pendingFeesCount++
				}
			}
		}

		percentage := 0
		if totalAmount > 0 {
			percentage = int((paidAmount / totalAmount) * 100)
		}

		// Class Attendance Tracker
		classAttendance := make([]map[string]any, 0)
		
		// Map of class_id -> has_attendance_today
		classStatus := make(map[string]bool)
		for _, a := range h.Store.Attendance {
			if a.SchoolID == ctx.SchoolID && !a.Date.Before(todayStart) && !a.Date.After(todayEnd) {
				if yearID != "" && a.AcademicYearID != "" && a.AcademicYearID != yearID {
					continue
				}
				classStatus[a.ClassID] = true
			}
		}

		for _, c := range h.Store.Classes {
			if c.SchoolID == ctx.SchoolID && (yearID == "" || c.AcademicYearID == yearID) && c.Status == "active" {
				hasAttendance := classStatus[c.ID]
				classAttendance = append(classAttendance, map[string]any{
					"id":             c.ID,
					"name":           c.Name,
					"has_attendance": hasAttendance,
				})
			}
		}

		attendancePercent := 0
		markedCount := present + absent
		if markedCount > 0 {
			attendancePercent = int(float64(present) / float64(markedCount) * 100)
		}

		return response{
			Overview: overview{
				TotalStudents:      students,
				TotalTeachers:      teachers,
				TotalClasses:       classes,
				AttendanceToday:    attendancePercent,
				AttendanceDetailed: map[string]int{"present": present, "absent": absent, "total": len(markedStudents)},
				ActiveExams:        activeExams,
				PendingLeave:       pendingLeave,
				UnmarkedStudents:   students - len(markedStudents),
				FeeCollection: map[string]int{
					"total":         int(totalAmount),
					"paid":          int(paidAmount),
					"percentage":    percentage,
					"pending_count": pendingFeesCount,
				},
			},
			Trends:          []map[string]any{},
			Alerts:          []map[string]any{},
			ClassAttendance: classAttendance,
			Activities:      activities,
		}, nil
	}))
}
