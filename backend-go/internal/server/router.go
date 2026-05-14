package server

import (
	"net/http"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/config"
	"github.com/eduplexo/backend-go/internal/domain/academicyear"
	"github.com/eduplexo/backend-go/internal/domain/announcements"
	"github.com/eduplexo/backend-go/internal/domain/attendance"
	authdomain "github.com/eduplexo/backend-go/internal/domain/auth"
	"github.com/eduplexo/backend-go/internal/domain/behavior"
	"github.com/eduplexo/backend-go/internal/domain/chatbot"
	"github.com/eduplexo/backend-go/internal/domain/classes"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/domain/events"
	"github.com/eduplexo/backend-go/internal/domain/exams"
	"github.com/eduplexo/backend-go/internal/domain/fees"
	"github.com/eduplexo/backend-go/internal/domain/homework"
	"github.com/eduplexo/backend-go/internal/domain/leave"
	"github.com/eduplexo/backend-go/internal/domain/liveclass"
	"github.com/eduplexo/backend-go/internal/domain/notifications"
	"github.com/eduplexo/backend-go/internal/domain/parent"
	"github.com/eduplexo/backend-go/internal/domain/results"
	"github.com/eduplexo/backend-go/internal/domain/settings"
	"github.com/eduplexo/backend-go/internal/domain/students"
	"github.com/eduplexo/backend-go/internal/domain/subjects"
	"github.com/eduplexo/backend-go/internal/domain/superadmin"
	"github.com/eduplexo/backend-go/internal/domain/teachers"
	"github.com/eduplexo/backend-go/internal/domain/timetable"
	"github.com/eduplexo/backend-go/internal/middleware"
	"github.com/eduplexo/backend-go/internal/persistence"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/eduplexo/backend-go/internal/stubs"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

// Router builds the full chi mux. Routes mirror old-app/school-app/app/api
// 1:1 — same paths, same methods, same response envelope.
//
// `pg` may be nil/no-op; in that case Save is a no-op and we run in pure
// in-memory mode (handy for unit tests and development without a database).
func Router(cfg config.Config, s *store.MemStore, pg *persistence.Persister) http.Handler {
	r := chi.NewRouter()

	r.Use(chimw.RequestID)
	r.Use(middleware.NewCORS(cfg))
	r.Use(middleware.Recover)
	r.Use(middleware.Logger)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		api.WriteJSON(w, http.StatusOK, map[string]any{
			"ok":     true,
			"status": "healthy",
			"db":     pg.Available(),
		})
	})

	authH := authdomain.New(cfg, s)
	saveFn := func(table string, doc any) {
		switch {
		case len(table) > 7 && table[len(table)-7:] == ":delete":
			pg.Delete(table[:len(table)-7], asString(doc))
		default:
			pg.Save(table, doc)
		}
	}

	r.Route("/api", func(r chi.Router) {
		// ─── Public auth endpoints ───────────────────────────────────────
		r.Post("/auth/login", authH.Login)
		r.Post("/auth/signup", authH.Signup)
		r.Get("/auth/session", authH.Session)
		r.Post("/auth/_log", authH.Log)
		r.Get("/auth/google/status", authH.GoogleStatus)
		r.Get("/auth/google/callback", authH.GoogleStatus)
		r.Post("/auth/google/calendar", stubs.NotImplemented("Google Calendar OAuth is not enabled in this environment."))
		r.Post("/auth/google/disconnect", stubs.NotImplemented("Google Calendar OAuth is not enabled in this environment."))

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(cfg))

			ayH := academicyear.New(s)
			r.Get("/academic-years", ayH.List)
			r.Post("/academic-years", ayH.Create)
			r.Get("/academic-years/{id}", ayH.Get)
			r.Patch("/academic-years/{id}", ayH.Update)
			r.Delete("/academic-years/{id}", ayH.Delete)
			r.Post("/academic-years/switch", authH.SwitchAcademicYear)

			stH := students.New(s)
			r.Get("/students", stH.List)
			r.Post("/students", stH.Create)
			r.Get("/students/{id}", stH.Get)
			r.Patch("/students/{id}", stH.Update)
			r.Put("/students/{id}", stH.Update)
			r.Delete("/students/{id}", stH.Delete)

			tcH := teachers.New(s)
			r.Get("/teachers", tcH.List)
			r.Post("/teachers", tcH.Create)
			r.Get("/teachers/{id}", tcH.Get)
			r.Patch("/teachers/{id}", tcH.Update)
			r.Put("/teachers/{id}", tcH.Update)
			r.Delete("/teachers/{id}", tcH.Delete)

			clH := classes.New(s)
			r.Get("/classes", clH.List)
			r.Post("/classes", clH.Create)
			r.Get("/classes/{id}", clH.Get)
			r.Patch("/classes/{id}", clH.Update)
			r.Put("/classes/{id}", clH.Update)
			r.Delete("/classes/{id}", clH.Delete)

			suH := subjects.New(s)
			r.Get("/subjects", suH.List)
			r.Post("/subjects", suH.Create)
			r.Get("/subjects/{id}", suH.Get)
			r.Patch("/subjects/{id}", suH.Update)
			r.Put("/subjects/{id}", suH.Update)
			r.Delete("/subjects/{id}", suH.Delete)
			r.Get("/school/subjects", suH.List)
			r.Get("/school/subjects/class/{classId}", suH.List)

			dH := dashboard.New(s)
			r.Get("/analytics/dashboard", dH.Get)

			atH := attendance.New(s)
			r.Get("/attendance", atH.List)
			r.Post("/attendance", atH.Create)
			r.Get("/attendance/{id}", atH.Get)
			r.Patch("/attendance/{id}", atH.Update)
			r.Put("/attendance/{id}", atH.Update)
			r.Delete("/attendance/{id}", atH.Delete)
			r.Post("/attendance/mark", atH.MarkBulk)

			exH := exams.New(s)
			r.Get("/exams", exH.List)
			r.Post("/exams", exH.Create)
			r.Get("/exams/{id}", exH.Get)
			r.Patch("/exams/{id}", exH.Update)
			r.Put("/exams/{id}", exH.Update)
			r.Delete("/exams/{id}", exH.Delete)

			rsH := results.New(s)
			r.Get("/results", rsH.List)
			r.Post("/results", rsH.Save)
			r.Get("/results/{id}", rsH.Get)
			r.Get("/exams/{id}/results", rsH.ListForExam)
			r.Post("/exams/{id}/results", rsH.Save)

			hwH := homework.New(s)
			r.Get("/homework", hwH.List)
			r.Post("/homework", hwH.Create)
			r.Get("/homework/{id}", hwH.Get)
			r.Patch("/homework/{id}", hwH.Update)
			r.Put("/homework/{id}", hwH.Update)
			r.Delete("/homework/{id}", hwH.Delete)

			bhH := behavior.New(s)
			r.Get("/behavior", bhH.List)
			r.Post("/behavior", bhH.Create)
			r.Get("/behavior/{id}", bhH.Get)
			r.Patch("/behavior/{id}", bhH.Update)
			r.Put("/behavior/{id}", bhH.Update)
			r.Delete("/behavior/{id}", bhH.Delete)

			evH := events.New(s)
			r.Get("/events", evH.List)
			r.Post("/events", evH.Create)
			r.Get("/events/{id}", evH.Get)
			r.Patch("/events/{id}", evH.Update)
			r.Put("/events/{id}", evH.Update)
			r.Delete("/events/{id}", evH.Delete)

			lvH := leave.New(s)
			r.Get("/leave", lvH.List)
			r.Post("/leave", lvH.Create)
			r.Get("/leave/{id}", lvH.Get)
			r.Patch("/leave/{id}", lvH.Update)
			r.Put("/leave/{id}", lvH.Update)
			r.Delete("/leave/{id}", lvH.Delete)

			ttH := timetable.New(s)
			r.Get("/timetable", ttH.List)
			r.Post("/timetable", ttH.Create)
			r.Get("/timetable/{id}", ttH.Get)
			r.Patch("/timetable/{id}", ttH.Update)
			r.Put("/timetable/{id}", ttH.Update)
			r.Delete("/timetable/{id}", ttH.Delete)

			anH := announcements.New(s)
			r.Get("/announcements", anH.List)
			r.Post("/announcements", anH.Create)
			r.Get("/announcements/{id}", anH.Get)
			r.Patch("/announcements/{id}", anH.Update)
			r.Put("/announcements/{id}", anH.Update)
			r.Delete("/announcements/{id}", anH.Delete)

			lcH := liveclass.New(s)
			r.Get("/live/classes", lcH.List)
			r.Post("/live/classes/schedule", lcH.Schedule)
			r.Get("/live/classes/{id}", lcH.Get)
			r.Patch("/live/classes/{id}", lcH.Update)
			r.Delete("/live/classes/{id}", lcH.Delete)

			ntH := notifications.New(s)
			r.Get("/notifications", ntH.List)
			r.Patch("/notifications/{id}/read", ntH.MarkRead)

			seH := settings.New(s)
			r.Get("/settings", seH.Get)
			r.Patch("/settings", seH.Update)
			r.Put("/settings", seH.Update)

			// ─── Fees domain (full implementation) ────────────────────────
			fH := fees.New(s, saveFn)
			r.Get("/school/fees/types", fH.ListFeeTypes)
			r.Get("/fees/types", fH.ListFeeTypes)
			r.Post("/fees/types", fH.CreateFeeType)

			r.Get("/classes/{id}/fees", fH.ListClassFees)
			r.Get("/classes/{id}/fees/components", fH.ListClassFees)
			r.Post("/classes/{id}/fees/components", fH.AddClassFee)
			r.Patch("/classes/{id}/fees/components/{feeId}", fH.UpdateClassFee)
			r.Delete("/classes/{id}/fees/components/{feeId}", fH.DeleteClassFee)
			r.Post("/classes/{id}/fees/components/{feeId}/toggle", fH.ToggleClassFee)
			r.Post("/classes/{id}/fees/components/{feeId}/duplicate", fH.DuplicateClassFee)

			r.Post("/fees/generate", fH.Generate)
			r.Get("/fees", fH.ListMonthly)
			r.Get("/fees/ledger", fH.LedgerDashboard)
			r.Post("/fees/{feeId}/pay", fH.RecordPayment)
			r.Get("/fees/payments", fH.ListPayments)
			r.Get("/fees/daily-collection", fH.DailyCollection)

			r.Get("/fees/adjustments", fH.ListAdjustments)
			r.Post("/fees/adjustments", fH.CreateAdjustment)
			r.Delete("/fees/adjustments/{id}", fH.DeleteAdjustment)

			r.Get("/school/fees/dashboard-stats", fH.DashboardStats)
			r.Get("/school/fees/classes-summary", fH.ClassesSummary)

			// Domain
			r.Get("/domain/status", stubs.DomainStatus)
			r.Post("/domain/setup", stubs.NotImplemented(""))

			// Chatbot
			cbH := chatbot.New(s)
			r.Post("/chatbot/message", cbH.Message)

			// Super Admin
			saH := superadmin.New(s)
			r.Get("/super-admin/dashboard", saH.DashboardStats)
			r.Get("/super-admin/schools", saH.ListSchools)
			r.Get("/super-admin/schools/{id}", saH.GetSchool)
			r.Patch("/super-admin/schools/{id}/status", saH.UpdateSchoolStatus)
			r.Post("/super-admin/schools/{id}/approve", saH.ApproveSchool)
			r.Post("/super-admin/schools/{id}/suspend", saH.SuspendSchool)
			r.Get("/super-admin/plans", saH.ListPlans)
			r.Get("/super-admin/users", saH.ListUsers)
			r.Get("/super-admin/activity", saH.RecentActivity)

			// Parents
			r.Get("/parents/check-email", func(w http.ResponseWriter, _ *http.Request) {
				api.WriteResult(w, api.Ok(map[string]any{"exists": false}))
			})
			r.Post("/parents/link-student", stubs.NotImplemented(""))

			// Parent portal
			pH := parent.New(s)
			r.Get("/parent/student-info", pH.StudentInfo)
			r.Get("/parent/children", pH.Children)
			r.Get("/parent/dashboard/stats", pH.DashboardStats)
			r.Get("/parent/student-results", pH.StudentResults)
			r.Get("/parent/student-attendance", pH.StudentAttendance)
			r.Get("/parent/attendance", pH.StudentAttendance)
			r.Get("/parent/fees", fH.StudentFees)
			r.Get("/student/fees", fH.StudentFees)
			r.Get("/parent/child/homework", pH.ChildHomework)
			r.Get("/parent/child/announcements", pH.ChildAnnouncements)
			r.Get("/parent/performance-chart", pH.PerformanceChart)
			r.Get("/school/my-classes", clH.List)

			r.Post("/dev/seed-academic-years", stubs.NotImplemented(""))
			r.Get("/auth/google", authH.GoogleStatus)
		})
	})

	return r
}

func asString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
