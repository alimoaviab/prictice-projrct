// dashboard_pg.go — Direct PostgreSQL dashboard handler.
//
// This replaces the MemStore-based dashboard with parallel PG queries using
// errgroup. Falls back to the MemStore handler if PG is not available.
//
// Query strategy (all run in parallel via errgroup):
//   1. mv_school_dashboard → student/teacher/class counts
//   2. leaves WHERE status='pending' → pending leave count
//   3. mv_fee_summary → fee collection stats
//   4. audit_logs ORDER BY created_at DESC LIMIT 10 → recent activity
//   5. attendance WHERE date=today → attendance summary
//   6. exams WHERE status IN ('scheduled','active') → active exam count
//
// Total latency: max(individual query times) ≈ 5-15ms (vs 40-200ms MemStore)
package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/sync/errgroup"
)

// PGHandler serves the dashboard from direct PostgreSQL queries + Redis cache.
type PGHandler struct {
	Pool  *pgxpool.Pool
	Cache *cache.Client
	Store *store.MemStore // Fallback if PG is unavailable
}

// NewPG creates a dashboard handler that queries PostgreSQL directly.
// If pool is nil, falls back to the MemStore-based handler.
func NewPG(pool *pgxpool.Pool, c *cache.Client, s *store.MemStore) *PGHandler {
	return &PGHandler{Pool: pool, Cache: c, Store: s}
}

// Get implements GET /api/analytics/dashboard using direct PG queries.
func (h *PGHandler) Get(w http.ResponseWriter, r *http.Request) {
	// If PG is not available, fall back to MemStore handler
	if h.Pool == nil {
		fallback := NewWithCache(h.Store, h.Cache)
		fallback.Get(w, r)
		return
	}

	ctx := api.FromRequest(r)
	yearID := tenant.ResolveAcademicYearID(h.Store, ctx, r.URL.Query().Get("academic_year_id"))
	cacheKey := CacheKey(ctx.SchoolID, yearID)

	// ─── Try Redis cache first ─────────────────────────────────────────
	if h.Cache != nil && h.Cache.Available() {
		cached, err := h.Cache.Get(r.Context(), cacheKey)
		if err != nil {
			log.Printf("[dashboard-pg] Redis GET error (continuing): %v", err)
		} else if cached != nil {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			w.Header().Set("X-Source", "pg")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(cached)
			return
		}
	}

	// ─── Cache MISS — run parallel PG queries ──────────────────────────
	result, err := h.queryDashboard(r.Context(), ctx.SchoolID, yearID)
	if err != nil {
		log.Printf("[dashboard-pg] query error, falling back to MemStore: %v", err)
		// Fallback to MemStore on PG error
		fallback := NewWithCache(h.Store, h.Cache)
		fallback.Get(w, r)
		return
	}

	// Wrap in ServiceResult envelope
	envelope := api.Ok(result)
	resultJSON, err := json.Marshal(envelope)
	if err != nil {
		log.Printf("[dashboard-pg] JSON marshal error: %v", err)
		api.WriteResult(w, envelope)
		return
	}

	// ─── Cache the result ──────────────────────────────────────────────
	if h.Cache != nil && h.Cache.Available() {
		if err := h.Cache.Set(r.Context(), cacheKey, resultJSON, CacheTTL); err != nil {
			log.Printf("[dashboard-pg] Redis SET error (non-fatal): %v", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.Header().Set("X-Source", "pg")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(resultJSON)
}

// dashResult holds the combined results from all parallel queries.
type dashResult struct {
	Overview        overview         `json:"overview"`
	Trends          []map[string]any `json:"trends"`
	Alerts          []map[string]any `json:"alerts"`
	ClassAttendance []map[string]any `json:"classAttendance"`
	Activities      []map[string]any `json:"activities"`
}

// queryDashboard runs 6 queries in parallel using errgroup.
func (h *PGHandler) queryDashboard(ctx context.Context, schoolID, yearID string) (*dashResult, error) {
	g, gctx := errgroup.WithContext(ctx)

	var (
		activeStudents int
		activeTeachers int
		activeClasses  int
		pendingLeave   int
		activeExams    int
		feeTotal       float64
		feePaid        float64
		feePending     int
		present        int
		absent         int
		totalMarked    int
		activities     []map[string]any
		classAtt       []map[string]any
	)

	today := time.Now().Format("2006-01-02")

	// ─── Query 1: Materialized view — school counts ────────────────────
	g.Go(func() error {
		row := h.Pool.QueryRow(gctx, `
			SELECT COALESCE(active_students, 0), 
			       COALESCE(active_teachers, 0), 
			       COALESCE(active_classes, 0)
			FROM mv_school_dashboard
			WHERE school_id = $1 AND academic_year_id = $2
		`, schoolID, yearID)

		err := row.Scan(&activeStudents, &activeTeachers, &activeClasses)
		if err != nil {
			// View might be empty for new schools — not fatal
			log.Printf("[dashboard-pg] mv_school_dashboard scan: %v (using zeros)", err)
			return nil
		}
		return nil
	})

	// ─── Query 2: Pending leaves ───────────────────────────────────────
	g.Go(func() error {
		row := h.Pool.QueryRow(gctx, `
			SELECT COUNT(*) FROM leaves
			WHERE school_id = $1 AND status = 'pending'
		`, schoolID)
		return row.Scan(&pendingLeave)
	})

	// ─── Query 3: Fee summary from materialized view ───────────────────
	g.Go(func() error {
		row := h.Pool.QueryRow(gctx, `
			SELECT COALESCE(SUM(total_expected), 0),
			       COALESCE(SUM(total_collected), 0),
			       COALESCE(SUM(unpaid_count + partial_count), 0)
			FROM mv_fee_summary
			WHERE school_id = $1 AND academic_year_id = $2
		`, schoolID, yearID)

		err := row.Scan(&feeTotal, &feePaid, &feePending)
		if err != nil {
			log.Printf("[dashboard-pg] mv_fee_summary scan: %v (using zeros)", err)
			return nil
		}
		return nil
	})

	// ─── Query 4: Recent audit logs (last 10) ──────────────────────────
	g.Go(func() error {
		rows, err := h.Pool.Query(gctx, `
			SELECT id, action, entity_type, actor_email, created_at
			FROM audit_logs
			WHERE school_id = $1
			ORDER BY created_at DESC
			LIMIT 10
		`, schoolID)
		if err != nil {
			log.Printf("[dashboard-pg] audit_logs query: %v", err)
			return nil
		}
		defer rows.Close()

		activities = make([]map[string]any, 0, 10)
		for rows.Next() {
			var id, action, entityType, actorEmail string
			var createdAt time.Time
			if err := rows.Scan(&id, &action, &entityType, &actorEmail, &createdAt); err != nil {
				continue
			}
			activities = append(activities, map[string]any{
				"_id":         id,
				"action":      action,
				"entity_type": entityType,
				"actor_email": actorEmail,
				"created_at":  createdAt,
			})
		}
		return nil
	})

	// ─── Query 5: Today's attendance summary ───────────────────────────
	g.Go(func() error {
		row := h.Pool.QueryRow(gctx, `
			SELECT 
				COUNT(*) FILTER (WHERE status IN ('present', 'late', 'excused')) AS present_count,
				COUNT(*) FILTER (WHERE status = 'absent') AS absent_count,
				COUNT(DISTINCT student_id) AS total_marked
			FROM attendance
			WHERE school_id = $1 
			  AND date = $2::date
			  AND ($3 = '' OR academic_year_id = $3)
		`, schoolID, today, yearID)

		err := row.Scan(&present, &absent, &totalMarked)
		if err != nil {
			log.Printf("[dashboard-pg] attendance today scan: %v (using zeros)", err)
			return nil
		}
		return nil
	})

	// ─── Query 6: Active exams + class attendance tracker ──────────────
	g.Go(func() error {
		// Active exams
		row := h.Pool.QueryRow(gctx, `
			SELECT COUNT(*) FROM exams
			WHERE school_id = $1 
			  AND ($2 = '' OR academic_year_id = $2)
			  AND status IN ('scheduled', 'active')
		`, schoolID, yearID)
		if err := row.Scan(&activeExams); err != nil {
			log.Printf("[dashboard-pg] active exams scan: %v", err)
		}

		// Class attendance tracker
		rows, err := h.Pool.Query(gctx, `
			SELECT c.id, c.name,
			       EXISTS(
			           SELECT 1 FROM attendance a 
			           WHERE a.school_id = c.school_id 
			             AND a.class_id = c.id 
			             AND a.date = $3::date
			       ) AS has_attendance
			FROM classes c
			WHERE c.school_id = $1 
			  AND c.academic_year_id = $2
			  AND c.status = 'active'
			ORDER BY c.name
		`, schoolID, yearID, today)
		if err != nil {
			log.Printf("[dashboard-pg] class attendance query: %v", err)
			return nil
		}
		defer rows.Close()

		classAtt = make([]map[string]any, 0)
		for rows.Next() {
			var id, name string
			var hasAtt bool
			if err := rows.Scan(&id, &name, &hasAtt); err != nil {
				continue
			}
			classAtt = append(classAtt, map[string]any{
				"id":             id,
				"name":           name,
				"has_attendance": hasAtt,
			})
		}
		return nil
	})

	// Wait for all queries to complete
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("parallel queries failed: %w", err)
	}

	// Compute derived values
	attendancePercent := 0
	markedCount := present + absent
	if markedCount > 0 {
		attendancePercent = int(float64(present) / float64(markedCount) * 100)
	}

	feePercentage := 0
	if feeTotal > 0 {
		feePercentage = int((feePaid / feeTotal) * 100)
	}

	if activities == nil {
		activities = []map[string]any{}
	}
	if classAtt == nil {
		classAtt = []map[string]any{}
	}

	return &dashResult{
		Overview: overview{
			TotalStudents:   activeStudents,
			TotalTeachers:   activeTeachers,
			TotalClasses:    activeClasses,
			AttendanceToday: attendancePercent,
			AttendanceDetailed: map[string]int{
				"present": present,
				"absent":  absent,
				"total":   totalMarked,
			},
			ActiveExams:    activeExams,
			PendingLeave:   pendingLeave,
			UnmarkedStudents: activeStudents - totalMarked,
			FeeCollection: map[string]int{
				"total":         int(feeTotal),
				"paid":          int(feePaid),
				"percentage":    feePercentage,
				"pending_count": feePending,
			},
		},
		Trends:          []map[string]any{},
		Alerts:          []map[string]any{},
		ClassAttendance: classAtt,
		Activities:      activities,
	}, nil
}

// RefreshMaterializedViews refreshes both dashboard materialized views.
// Call this from a background goroutine every 5 minutes.
func RefreshMaterializedViews(ctx context.Context, pool *pgxpool.Pool) error {
	if pool == nil {
		return nil
	}

	start := time.Now()

	_, err := pool.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_school_dashboard")
	if err != nil {
		return fmt.Errorf("refresh mv_school_dashboard: %w", err)
	}

	_, err = pool.Exec(ctx, "REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fee_summary")
	if err != nil {
		return fmt.Errorf("refresh mv_fee_summary: %w", err)
	}

	log.Printf("[dashboard-pg] materialized views refreshed in %s", time.Since(start))
	return nil
}
