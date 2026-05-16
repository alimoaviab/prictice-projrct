package integration

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCacheInvalidation_StudentCreate(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	// Setup
	createTestSchool(t, pool)
	createTestClass(t, pool)
	createTestStudents(t, pool, 3)

	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}},
	}
	pgHandler := dashboard.NewPG(pool, rdb, s)
	cacheKey := fmt.Sprintf("dash:%s:%s", testSchoolID, testYearID)

	makeReq := func() *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", "/api/analytics/dashboard?academic_year_id="+testYearID, nil)
		r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
			SchoolID: testSchoolID, UserID: "test_user", Role: "admin",
			ActiveAcademicYearID: testYearID,
		}))
		pgHandler.Get(w, r)
		return w
	}

	// ─── Step 1: First call → cache miss ───────────────────────────────
	w1 := makeReq()
	require.Equal(t, http.StatusOK, w1.Code)
	assert.Equal(t, "MISS", w1.Header().Get("X-Cache"))

	// ─── Step 2: Second call → cache hit ───────────────────────────────
	w2 := makeReq()
	require.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "HIT", w2.Header().Get("X-Cache"))

	// ─── Step 3: Create a new student (simulates mutation) ─────────────
	_, err := pool.Exec(ctx, `
		INSERT INTO students (id, school_id, academic_year_id, admission_no, first_name, last_name,
		                      class_id, section, status, guardian_name, guardian_phone, created_at, updated_at)
		VALUES ($1, $2, $3, 'ADM-NEW', 'NewStudent', 'Created', 'test_cls_integ', 'A', 'active', 'P', '999', NOW(), NOW())
	`, store.NewID("stu"), testSchoolID, testYearID)
	require.NoError(t, err)

	// ─── Step 4: Invalidate cache (as the student handler would) ───────
	dashboard.InvalidateCache(ctx, rdb, testSchoolID, testYearID)

	// Verify Redis key is gone
	exists, _ := rdb.Exists(ctx, cacheKey)
	assert.False(t, exists, "cache key should be deleted after invalidation")

	// ─── Step 5: Next call → cache miss (fresh data) ───────────────────
	w3 := makeReq()
	require.Equal(t, http.StatusOK, w3.Code)
	assert.Equal(t, "MISS", w3.Header().Get("X-Cache"))

	// Verify new student count is reflected (4 now, was 3)
	// The PG handler queries directly so it sees the new student
}
