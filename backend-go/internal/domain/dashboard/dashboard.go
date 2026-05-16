// Package dashboard implements /api/analytics/dashboard. Mirrors the
// `getOverviewStats` shape from old-app/shared/services/dashboard-analytics.service.ts
// and reuses the same overall response envelope the original Node route
// returns to the frontend.
//
// Performance: Uses Redis cache with 5-minute TTL. On cache hit, returns
// pre-serialized JSON directly (zero MemStore scans). On miss, computes
// from MemStore and caches the result.
package dashboard

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/tenant"
	"github.com/eduplexo/backend-go/internal/store"
)

// CacheTTL is the dashboard cache duration. 5 minutes balances freshness
// with performance — attendance/fee mutations invalidate the cache anyway.
const CacheTTL = 5 * time.Minute

type Handler struct {
	Store *store.MemStore
	Cache *cache.Client
}

func New(s *store.MemStore) *Handler { return &Handler{Store: s} }

// NewWithCache creates a dashboard handler with Redis caching enabled.
func NewWithCache(s *store.MemStore, c *cache.Client) *Handler {
	return &Handler{Store: s, Cache: c}
}

type overview struct {
	TotalStudents      int            `json:"totalStudents"`
	TotalTeachers      int            `json:"totalTeachers"`
	TotalClasses       int            `json:"totalClasses"`
	AttendanceToday    int            `json:"attendanceToday"`
	AttendanceDetailed map[string]int `json:"attendanceDetailed"`
	ActiveExams        int            `json:"activeExams"`
	PendingLeave       int            `json:"pendingLeave"`
	UnmarkedStudents   int            `json:"unmarkedStudents"`
	FeeCollection      map[string]int `json:"feeCollection"`
}

type response struct {
	Overview        overview         `json:"overview"`
	Trends          []map[string]any `json:"trends"`
	Alerts          []map[string]any `json:"alerts"`
	ClassAttendance []map[string]any `json:"classAttendance"`
	Activities      []map[string]any `json:"activities"`
}

// CacheKey returns the Redis key for a school's dashboard cache.
func CacheKey(schoolID, yearID string) string {
	return fmt.Sprintf("dash:%s:%s", schoolID, yearID)
}

// InvalidateCache deletes the dashboard cache for a school. Call this after
// any mutation that affects dashboard stats (student CRUD, attendance mark,
// fee payment, leave request, etc).
func InvalidateCache(ctx context.Context, c *cache.Client, schoolID, yearID string) {
	if c == nil || !c.Available() {
		return
	}
	key := CacheKey(schoolID, yearID)
	if _, err := c.Del(ctx, key); err != nil {
		log.Printf("[dashboard] cache invalidation failed for %s: %v", key, err)
	}
}

// InvalidateCacheAllYears deletes dashboard cache for all academic years of
// a school. Used when the mutation doesn't carry a specific year ID.
func InvalidateCacheAllYears(ctx context.Context, c *cache.Client, schoolID string) {
	if c == nil || !c.Available() {
		return
	}
	pattern := fmt.Sprintf("dash:%s:*", schoolID)
	if _, err := c.DelPattern(ctx, pattern); err != nil {
		log.Printf("[dashboard] cache pattern invalidation failed for %s: %v", pattern, err)
	}
}

// Get implements GET /api/analytics/dashboard.
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	ctx := api.FromRequest(r)
	yearID := tenant.ResolveAcademicYearID(h.Store, ctx, r.URL.Query().Get("academic_year_id"))
	cacheKey := CacheKey(ctx.SchoolID, yearID)

	// ─── Try Redis cache first ─────────────────────────────────────────
	if h.Cache != nil && h.Cache.Available() {
		cached, err := h.Cache.Get(r.Context(), cacheKey)
		if err != nil {
			// Redis error — log and continue without cache (graceful degradation)
			log.Printf("[dashboard] Redis GET error (continuing without cache): %v", err)
		} else if cached != nil {
			// Cache HIT — return pre-serialized JSON directly
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("X-Cache", "HIT")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(cached)
			return
		}
	}

	// ─── Cache MISS — compute from MemStore ────────────────────────────
	result := h.computeDashboard(ctx, yearID)

	// Serialize the result
	resultJSON, err := json.Marshal(result)
	if err != nil {
		log.Printf("[dashboard] JSON marshal error: %v", err)
		w.Header().Set("X-Cache", "MISS")
		api.WriteResult(w, result)
		return
	}

	// ─── Store in Redis (non-blocking, errors are non-fatal) ───────────
	if h.Cache != nil && h.Cache.Available() {
		if err := h.Cache.Set(r.Context(), cacheKey, resultJSON, CacheTTL); err != nil {
			log.Printf("[dashboard] Redis SET error (non-fatal): %v", err)
		}
	}

	// Return response with MISS header
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Cache", "MISS")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(resultJSON)
}

// computeDashboard runs the full MemStore aggregation and returns a
// ServiceResult. This is the original logic extracted into a separate method.
func (h *Handler) computeDashboard(ctx *api.RequestContext, yearID string) api.ServiceResult {
	return api.ServiceTry(func() (response, error) {
		h.Store.RLock()
		defer h.Store.RUnlock()

		var (
			students int
			teachers int
			classes  int
		)
		for _, s := range h.Store.Students {
			if s.SchoolID == ctx.SchoolID {
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
		markedStudents := make(map[string]bool)

		for _, a := range h.Store.Attendance {
			if a.SchoolID == ctx.SchoolID && !a.Date.Before(todayStart) && !a.Date.After(todayEnd) {
				if yearID != "" && a.AcademicYearID != "" && a.AcademicYearID != yearID {
					continue
				}
				if markedStudents[a.StudentID] {
					continue
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
	})
}
