package server

import (
	"context"
	"net/http"
	"runtime"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	// "github.com/eduplexo/backend-go/internal/ai"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/config"
	"github.com/eduplexo/backend-go/internal/domain/academicyear"
	"github.com/eduplexo/backend-go/internal/domain/announcements"
	"github.com/eduplexo/backend-go/internal/domain/attendance"
	authdomain "github.com/eduplexo/backend-go/internal/domain/auth"
	"github.com/eduplexo/backend-go/internal/domain/behavior"
	"github.com/eduplexo/backend-go/internal/domain/certificates"
	"github.com/eduplexo/backend-go/internal/domain/classes"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/domain/events"
	"github.com/eduplexo/backend-go/internal/domain/exams"
	"github.com/eduplexo/backend-go/internal/domain/fees"
	"github.com/eduplexo/backend-go/internal/domain/homework"
	"github.com/eduplexo/backend-go/internal/domain/leave"
	"github.com/eduplexo/backend-go/internal/domain/liveclass"
	"github.com/eduplexo/backend-go/internal/domain/notifications"
	"github.com/eduplexo/backend-go/internal/domain/packages"
	"github.com/eduplexo/backend-go/internal/domain/parent"
	"github.com/eduplexo/backend-go/internal/domain/results"
	"github.com/eduplexo/backend-go/internal/domain/seo"
	"github.com/eduplexo/backend-go/internal/domain/settings"
	"github.com/eduplexo/backend-go/internal/domain/students"
	"github.com/eduplexo/backend-go/internal/domain/subjects"
	"github.com/eduplexo/backend-go/internal/domain/subscription"
	"github.com/eduplexo/backend-go/internal/domain/superadmin"
	"github.com/eduplexo/backend-go/internal/domain/teachers"
	"github.com/eduplexo/backend-go/internal/domain/timetable"
	"github.com/eduplexo/backend-go/internal/metrics"
	"github.com/eduplexo/backend-go/internal/middleware"
	"github.com/eduplexo/backend-go/internal/persistence"
	rt "github.com/eduplexo/backend-go/internal/realtime"
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
func Router(cfg config.Config, s *store.MemStore, pg *persistence.Persister, rdb *cache.Client) http.Handler {
	r := chi.NewRouter()

	// Initialize WebSocket hub and job queue
	var wsHub *rt.Hub
	var jobQueue *rt.JobQueue
	if rdb != nil && rdb.Available() {
		wsHub = rt.NewHub(rdb.Raw())
		jobQueue = rt.NewJobQueue(rdb.Raw())
	} else {
		wsHub = rt.NewHub(nil)
		jobQueue = rt.NewJobQueue(nil)
	}

	r.Use(chimw.RequestID)
	r.Use(middleware.NewCORS(cfg))
	r.Use(middleware.Compress) // Gzip level 5 for all JSON responses
	r.Use(metrics.Middleware)  // Prometheus request duration + status
	r.Use(middleware.Recover)
	r.Use(middleware.Logger)

	// Prometheus metrics endpoint (no auth required — restrict via nginx in prod)
	r.Handle("/metrics", metrics.Handler())

	// ─── Health check endpoints ──────────────────────────────────────────
	// /health       — full dependency check (PG + Redis + memory)
	// /health/ready — same as /health (for k8s readiness probe)
	// /health/live  — always 200 (for k8s liveness probe)
	healthCheck := buildHealthHandler(pg, rdb)
	r.Get("/health", healthCheck)
	r.Get("/health/ready", healthCheck)
	r.Get("/health/live", func(w http.ResponseWriter, _ *http.Request) {
		api.WriteJSON(w, http.StatusOK, map[string]any{"status": "alive"})
	})

	saveFn := func(table string, doc any) {
			switch {
			case len(table) > 7 && table[len(table)-7:] == ":delete":
				if s, ok := doc.(string); ok {
					pg.Delete(table[:len(table)-7], s)
				} else {
					pg.DeleteWithDoc(table[:len(table)-7], doc)
				}
			default:
				pg.Save(table, doc)
			}
	}

	authH := authdomain.NewWithPersist(cfg, s, saveFn)

	// ─── WebSocket endpoint (requires auth) ──────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(middleware.Authenticator(cfg, s))
		r.Get("/ws", wsHub.ServeWS)
	})

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

		// ─── Public SEO Engine (landing page tool, rate-limited) ─────────
		seoH := seo.New(cfg.AnthropicAPIKey, rdb)
		r.Post("/seo/generate", seoH.Generate)

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticator(cfg, s))

			ayH := academicyear.New(s, saveFn)
			r.Get("/academic-years", ayH.List)
			r.Post("/academic-years", ayH.Create)
			r.Get("/academic-years/{id}", ayH.Get)
			r.Patch("/academic-years/{id}", ayH.Update)
			r.Delete("/academic-years/{id}", ayH.Delete)
			r.Post("/academic-years/switch", authH.SwitchAcademicYear)

			stH := students.NewPG(s, saveFn, pg.Pool(), rdb)
			// Subscription limit checker is set after subH is created below
			r.Get("/students", stH.List)
			r.Post("/students", stH.Create)
			r.Get("/students/{id}", stH.Get)
			r.Patch("/students/{id}", stH.Update)
			r.Put("/students/{id}", stH.Update)
			r.Delete("/students/{id}", stH.Delete)

			tcH := teachers.NewPG(s, saveFn, pg.Pool(), rdb)
			r.Get("/teachers", tcH.List)
			r.Post("/teachers", tcH.Create)
			r.Get("/teachers/{id}", tcH.Get)
			r.Patch("/teachers/{id}", tcH.Update)
			r.Put("/teachers/{id}", tcH.Update)
			r.Delete("/teachers/{id}", tcH.Delete)

			clH := classes.NewWithCache(s, saveFn, rdb)
			r.Get("/classes", clH.List)
			r.Post("/classes", clH.Create)
			r.Get("/classes/{id}", clH.Get)
			r.Get("/classes/{id}/subjects", clH.GetSubjects)
			r.Patch("/classes/{id}", clH.Update)
			r.Put("/classes/{id}", clH.Update)
			r.Delete("/classes/{id}", clH.Delete)

			suH := subjects.NewWithCache(s, saveFn, rdb)
			r.Get("/subjects", suH.List)
			r.Post("/subjects", suH.Create)
			r.Get("/subjects/{id}", suH.Get)
			r.Patch("/subjects/{id}", suH.Update)
			r.Put("/subjects/{id}", suH.Update)
			r.Delete("/subjects/{id}", suH.Delete)
			r.Get("/school/subjects", suH.List)
			r.Get("/school/subjects/class/{classId}", suH.List)

			dH := dashboard.NewPG(pg.Pool(), rdb, s)
			r.Get("/analytics/dashboard", dH.Get)

			// Composite dashboard — single call replaces 4-6 separate queries
			compH := dashboard.NewComposite(s, rdb)
			r.Get("/dashboard/composite", compH.Get)

			atH := attendance.NewWithCache(s, saveFn, rdb)
			atPG := attendance.NewPG(pg.Pool(), rdb, s)
			r.Get("/attendance", atH.List)
			r.Post("/attendance", atH.Create)
			r.Get("/attendance/{id}", atH.Get)
			r.Patch("/attendance/{id}", atH.Update)
			r.Put("/attendance/{id}", atH.Update)
			r.Delete("/attendance/{id}", atH.Delete)
			r.Post("/attendance/mark", atPG.MarkBulkPG) // Direct PG batch insert
			r.Get("/attendance/sheet", atPG.Sheet)       // Direct PG JOIN query

			exH := exams.NewWithCache(s, saveFn, rdb)
			r.Get("/exams", exH.List)
			r.Post("/exams", exH.Create)
			r.Get("/exams/{id}", exH.Get)
			r.Patch("/exams/{id}", exH.Update)
			r.Put("/exams/{id}", exH.Update)
			r.Delete("/exams/{id}", exH.Delete)

			// Tests (Duplicates Exam logic with type=test)
			r.Get("/tests", exH.List)
			r.Post("/tests", exH.Create)
			r.Get("/tests/{id}", exH.Get)
			r.Patch("/tests/{id}", exH.Update)
			r.Put("/tests/{id}", exH.Update)
			r.Delete("/tests/{id}", exH.Delete)

			rsH := results.NewWithCache(s, saveFn, rdb)
			r.Get("/results", rsH.List)
			r.Post("/results", rsH.Save)
			r.Get("/results/{id}", rsH.Get)
			r.Get("/exams/{id}/results", rsH.ListForExam)
			r.Post("/exams/{id}/results", rsH.Save)
			r.Get("/tests/{id}/results", rsH.ListForExam)
			r.Post("/tests/{id}/results", rsH.Save)

			hwH := homework.NewWithCache(s, saveFn, rdb)
			r.Get("/homework", hwH.List)
			r.Post("/homework", hwH.Create)
			r.Get("/homework/{id}", hwH.Get)
			r.Patch("/homework/{id}", hwH.Update)
			r.Put("/homework/{id}", hwH.Update)
			r.Delete("/homework/{id}", hwH.Delete)

			bhH := behavior.NewWithCache(s, rdb)
			r.Get("/behavior", bhH.List)
			r.Post("/behavior", bhH.Create)
			r.Get("/behavior/{id}", bhH.Get)
			r.Patch("/behavior/{id}", bhH.Update)
			r.Put("/behavior/{id}", bhH.Update)
			r.Delete("/behavior/{id}", bhH.Delete)

			evH := events.NewWithCache(s, rdb)
			r.Get("/events", evH.List)
			r.Post("/events", evH.Create)
			r.Get("/events/{id}", evH.Get)
			r.Patch("/events/{id}", evH.Update)
			r.Put("/events/{id}", evH.Update)
			r.Delete("/events/{id}", evH.Delete)

			lvH := leave.NewWithCache(s, rdb)
			r.Get("/leave", lvH.List)
			r.Post("/leave", lvH.Create)
			r.Get("/leave/{id}", lvH.Get)
			r.Patch("/leave/{id}", lvH.Update)
			r.Put("/leave/{id}", lvH.Update)
			r.Delete("/leave/{id}", lvH.Delete)

			ttH := timetable.New(s, saveFn, rdb)
			r.Get("/timetable", ttH.List)
			r.Get("/timetable/summary", ttH.Summary)
			r.Post("/timetable", ttH.Create)
			r.Get("/timetable/{id}", ttH.Get)
			r.Patch("/timetable/{id}", ttH.Update)
			r.Put("/timetable/{id}", ttH.Update)
			r.Delete("/timetable/{id}", ttH.Delete)

			anH := announcements.NewWithCache(s, rdb)
			r.Get("/announcements", anH.List)
			r.Post("/announcements", anH.Create)
			r.Get("/announcements/{id}", anH.Get)
			r.Patch("/announcements/{id}", anH.Update)
			r.Put("/announcements/{id}", anH.Update)
			r.Delete("/announcements/{id}", anH.Delete)

			lcH := liveclass.NewWithCache(s, saveFn, rdb)
			r.Get("/live/classes", lcH.List)
			r.Post("/live/classes/schedule", lcH.Schedule)
			r.Get("/live/classes/{id}", lcH.Get)
			r.Patch("/live/classes/{id}", lcH.Update)
			r.Delete("/live/classes/{id}", lcH.Delete)

			ntH := notifications.New(s)
			r.Get("/notifications", ntH.List)
			r.Patch("/notifications/{id}/read", ntH.MarkRead)

			seH := settings.NewWithCacheAndPersist(s, rdb, saveFn)
			r.Get("/settings", seH.Get)
			r.Patch("/settings", seH.Update)
			r.Put("/settings", seH.Update)

			// ─── Certificates ─────────────────────────────────────────────
			certH := certificates.New(s, saveFn)
			r.Get("/certificates/templates", certH.ListTemplates)
			r.Get("/certificates/templates/{id}", certH.GetTemplate)
			r.Post("/certificates/templates", certH.CreateTemplate)
			r.Patch("/certificates/templates/{id}", certH.UpdateTemplate)
			r.Delete("/certificates/templates/{id}", certH.DeleteTemplate)
			r.Post("/certificates/templates/{id}/duplicate", certH.DuplicateTemplate)
			r.Get("/certificates", certH.ListCertificates)
			r.Post("/certificates/generate", certH.Generate)
			r.Post("/certificates/{id}/revoke", certH.Revoke)
			r.Get("/certificates/verify/{code}", certH.Verify)

			// ─── Fees domain (full implementation) ────────────────────────
			fH := fees.NewWithCache(s, saveFn, rdb)
			stH.OnStudentCreated = func(ctx *api.RequestContext, stu *store.Student) {
				fH.SyncInvoicesForClass(ctx, stu.ClassID)
			}
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

			// ─── Subscription & Billing ───────────────────────────────────
			subH := subscription.New(pg.Pool(), s)
			stH.LimitChecker = subH.CheckStudentLimit // Wire student limit enforcement
			r.Get("/subscription/current", subH.GetCurrent)
			r.Get("/subscription/plans", subH.GetPlans)
			r.Post("/subscription/upgrade", subH.Upgrade)
			r.Post("/subscription/start-trial", subH.StartTrial)
			r.Get("/subscription/history", subH.GetHistory)

			// Payment (School Admin)
			r.Get("/payment/methods", subH.ListPaymentMethods)
			r.Post("/payment/upload", subH.UploadPayment)

			// Super Admin — Plan Management
			r.Get("/admin/subscription/plans", subH.AdminListPlans)
			r.Post("/admin/subscription/plans", subH.AdminCreatePlan)
			r.Put("/admin/subscription/plans/{id}", subH.AdminUpdatePlan)
			r.Delete("/admin/subscription/plans/{id}", subH.AdminDeletePlan)
			r.Post("/admin/subscription/assign", subH.AdminAssignPlan)
			r.Post("/admin/subscription/extend", subH.AdminExtendSubscription)
			r.Get("/admin/subscription/analytics", subH.AdminAnalytics)

			// Super Admin — Payment Methods
			r.Get("/admin/payment-methods", subH.ListPaymentMethods)
			r.Post("/admin/payment-methods", subH.AdminCreatePaymentMethod)
			r.Put("/admin/payment-methods/{id}", subH.AdminUpdatePaymentMethod)
			r.Delete("/admin/payment-methods/{id}", subH.AdminDeletePaymentMethod)

			// Super Admin — Payment Verification
			r.Get("/admin/payments/pending", subH.AdminListPendingPayments)
			r.Get("/admin/payments/all", subH.AdminListPendingPayments)
			r.Post("/admin/payments/{id}/verify", subH.AdminVerifyPayment)
			r.Post("/admin/payments/{id}/reject", subH.AdminRejectPayment)

			// ─── Background Jobs ──────────────────────────────────────────
			r.Get("/jobs/{id}/status", rt.JobStatusHandler(jobQueue))
			r.Post("/fees/generate-async", rt.FeeGenerateAsyncHandler(jobQueue))

			// Super Admin
			saH := superadmin.NewWithPersist(s, saveFn)
			r.Get("/super-admin/dashboard", saH.DashboardStats)
			r.Get("/super-admin/schools", saH.ListSchools)
			r.Get("/super-admin/schools/{id}", saH.GetSchool)
			r.Patch("/super-admin/schools/{id}", saH.UpdateSchool)
			r.Patch("/super-admin/schools/{id}/status", saH.UpdateSchoolStatus)
			r.Patch("/super-admin/schools/{id}/password", saH.UpdateAdminPassword)
			r.Post("/super-admin/schools/{id}/approve", saH.ApproveSchool)
			r.Post("/super-admin/schools/{id}/suspend", saH.SuspendSchool)
			r.Get("/super-admin/plans", saH.ListPlans)
			r.Get("/super-admin/users", saH.ListUsers)
			r.Get("/super-admin/activity", saH.RecentActivity)

			// Packages Management (Super Admin only)
			pkgH := packages.NewWithPersist(s, saveFn)
			r.Post("/super-admin/packages", pkgH.Create)
			r.Get("/super-admin/packages", pkgH.List)
			r.Get("/super-admin/packages/{id}", pkgH.Get)
			r.Put("/super-admin/packages/{id}", pkgH.Update)
			r.Delete("/super-admin/packages/{id}", pkgH.Delete)
			r.Post("/super-admin/packages/{id}/toggle", pkgH.Toggle)

			// Subscriptions
			r.Get("/super-admin/subscriptions", saH.ListSubscriptions)
			r.Post("/super-admin/subscriptions/assign", subH.AdminAssignPlan)
			r.Post("/super-admin/subscriptions/extend", subH.AdminExtendSubscription)

			// AI Usage
			r.Get("/super-admin/ai-usage", saH.AIUsage)

			// Settings
			r.Get("/super-admin/settings", saH.GetSettings)
			r.Patch("/super-admin/settings", saH.UpdateSettings)

			// Parents — admin/teacher use these to link students to
			// existing parent accounts during student creation. The
			// real linkage write happens inside the students.Create
			// handler when `link_parent_user_id` (or a matching email)
			// is detected.
			r.Get("/parents/check-email", stH.CheckParentEmail)
			r.Post("/parents/check-email", stH.CheckParentEmail)
			r.Post("/parents/link-student", stubs.NotImplemented(""))

			// Parent portal
			pH := parent.NewWithCache(s, rdb)
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
			r.Get("/parent/live-classes", pH.LiveClasses)
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

// buildHealthHandler creates the /health endpoint that checks all dependencies.
func buildHealthHandler(pg *persistence.Persister, rdb *cache.Client) http.HandlerFunc {
	const memoryLimitBytes = 800 * 1024 * 1024 // 800MB

	return func(w http.ResponseWriter, r *http.Request) {
		checks := map[string]bool{
			"postgres": false,
			"redis":    false,
			"memory":   false,
		}

		// PostgreSQL check (2s timeout)
		if pg.Available() {
			pgCtx, pgCancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer pgCancel()
			if err := pg.Pool().Ping(pgCtx); err == nil {
				checks["postgres"] = true
			}
		}

		// Redis check (1s timeout)
		if rdb != nil && rdb.Available() {
			redisCtx, redisCancel := context.WithTimeout(r.Context(), 1*time.Second)
			defer redisCancel()
			if err := rdb.Ping(redisCtx); err == nil {
				checks["redis"] = true
			}
		} else {
			// Redis not configured — don't fail health check for optional dependency
			checks["redis"] = true
		}

		// Memory check
		var mem runtime.MemStats
		runtime.ReadMemStats(&mem)
		checks["memory"] = mem.Alloc < uint64(memoryLimitBytes)

		// Determine overall health
		healthy := checks["postgres"] && checks["memory"]
		status := http.StatusOK
		if !healthy {
			status = http.StatusServiceUnavailable
		}

		api.WriteJSON(w, status, map[string]any{
			"ok":       healthy,
			"status":   statusText(healthy),
			"checks":   checks,
			"memory_mb": int(mem.Alloc / 1024 / 1024),
		})
	}
}

func statusText(healthy bool) string {
	if healthy {
		return "healthy"
	}
	return "unhealthy"
}
