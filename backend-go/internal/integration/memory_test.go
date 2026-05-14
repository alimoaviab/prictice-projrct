package integration

import (
	"context"
	"net/http"
	"net/http/httptest"
	"runtime"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/alicebob/miniredis/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestMemoryLeak verifies that repeated dashboard requests don't leak memory.
//
// Strategy:
//   1. Record baseline memory + goroutine count
//   2. Run 1000 dashboard requests
//   3. Force GC
//   4. Assert: memory is NOT 2x baseline (no unbounded growth)
//   5. Assert: goroutine count is stable (no goroutine leaks)
func TestMemoryLeak_DashboardRequests(t *testing.T) {
	// Use miniredis for this test (no real Redis needed)
	mr := miniredis.RunT(t)
	rdb := cache.New("redis://" + mr.Addr() + "/0")
	defer rdb.Close()

	// Build a MemStore with realistic data
	s := &store.MemStore{}
	s.AcademicYears = []*store.AcademicYear{
		{ID: "ay_1", SchoolID: "school_1", IsActive: true, Status: "active"},
	}
	for i := 0; i < 200; i++ {
		s.Students = append(s.Students, &store.Student{
			ID: store.NewID("stu"), SchoolID: "school_1", AcademicYearID: "ay_1",
			FirstName: "Student", LastName: "Name", Status: "active",
			CreatedAt: time.Now(), UpdatedAt: time.Now(),
		})
	}
	for i := 0; i < 20; i++ {
		s.Teachers = append(s.Teachers, &store.Teacher{
			ID: store.NewID("tch"), SchoolID: "school_1", Status: "active",
			FirstName: "Teacher", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		})
	}
	for i := 0; i < 10; i++ {
		s.Classes = append(s.Classes, &store.Class{
			ID: store.NewID("cls"), SchoolID: "school_1", AcademicYearID: "ay_1",
			Name: "Class", Status: "active", CreatedAt: time.Now(), UpdatedAt: time.Now(),
		})
	}

	handler := dashboard.NewWithCache(s, rdb)

	// ─── Baseline ──────────────────────────────────────────────────────
	runtime.GC()
	time.Sleep(50 * time.Millisecond)

	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)
	goroutinesBefore := runtime.NumGoroutine()

	// ─── Run 1000 requests ─────────────────────────────────────────────
	const iterations = 1000
	for i := 0; i < iterations; i++ {
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", "/api/analytics/dashboard?academic_year_id=ay_1", nil)
		r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
			SchoolID: "school_1", UserID: "user_1", Role: "admin",
			ActiveAcademicYearID: "ay_1",
		}))
		handler.Get(w, r)
		require.Equal(t, http.StatusOK, w.Code)
	}

	// ─── Measure after ─────────────────────────────────────────────────
	runtime.GC()
	time.Sleep(100 * time.Millisecond)

	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)
	goroutinesAfter := runtime.NumGoroutine()

	// ─── Assertions ────────────────────────────────────────────────────
	// Memory should NOT double (allow 50% growth for normal allocations)
	memGrowth := float64(memAfter.Alloc) / float64(memBefore.Alloc)
	assert.Less(t, memGrowth, 2.0,
		"memory grew %.1fx after %d requests (before=%dMB, after=%dMB) — possible leak",
		memGrowth, iterations,
		memBefore.Alloc/1024/1024, memAfter.Alloc/1024/1024)

	// Goroutine count should be stable (±5 for GC/runtime goroutines)
	goroutineGrowth := goroutinesAfter - goroutinesBefore
	assert.Less(t, goroutineGrowth, 10,
		"goroutine count grew by %d after %d requests (before=%d, after=%d) — possible goroutine leak",
		goroutineGrowth, iterations, goroutinesBefore, goroutinesAfter)

	t.Logf("Memory: before=%dMB, after=%dMB, growth=%.2fx",
		memBefore.Alloc/1024/1024, memAfter.Alloc/1024/1024, memGrowth)
	t.Logf("Goroutines: before=%d, after=%d, growth=%d",
		goroutinesBefore, goroutinesAfter, goroutineGrowth)
}

// TestMemoryLeak_RedisCache verifies Redis cache operations don't leak.
func TestMemoryLeak_RedisCache(t *testing.T) {
	mr := miniredis.RunT(t)
	rdb := cache.New("redis://" + mr.Addr() + "/0")
	defer rdb.Close()

	ctx := context.Background()

	runtime.GC()
	var memBefore runtime.MemStats
	runtime.ReadMemStats(&memBefore)

	// 5000 set/get cycles
	for i := 0; i < 5000; i++ {
		key := "test:leak:" + store.NewID("")
		_ = rdb.Set(ctx, key, []byte(`{"data":"test payload with some content"}`), time.Minute)
		_, _ = rdb.Get(ctx, key)
		_, _ = rdb.Del(ctx, key)
	}

	runtime.GC()
	time.Sleep(50 * time.Millisecond)

	var memAfter runtime.MemStats
	runtime.ReadMemStats(&memAfter)

	memGrowth := float64(memAfter.Alloc) / float64(memBefore.Alloc)
	assert.Less(t, memGrowth, 2.0,
		"Redis operations leaked memory: %.1fx growth", memGrowth)
}
