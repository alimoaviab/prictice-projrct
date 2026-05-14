package integration

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCompositeDashboard_FullIntegration(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	// Cleanup before and after
	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	// ─── Setup test data ───────────────────────────────────────────────
	createTestSchool(t, pool)
	classID := createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 5)
	createTestTeachers(t, pool, 2)
	createTestLeave(t, pool, "pending")

	// Mark attendance: 3 present, 2 absent
	today := time.Now().Format("2006-01-02")
	for i, sid := range studentIDs {
		status := "present"
		if i >= 3 {
			status = "absent"
		}
		_, err := pool.Exec(ctx, `
			INSERT INTO attendance (id, school_id, academic_year_id, student_id, class_id, date, period, status, marked_by, source, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6::date, 1, $7, 'test_user', 'manual', NOW(), NOW())
		`, store.NewID("att"), testSchoolID, testYearID, sid, classID, today, status)
		require.NoError(t, err)
	}

	// Insert fee records
	for _, sid := range studentIDs {
		_, err := pool.Exec(ctx, `
			INSERT INTO fees (id, school_id, student_id, class_id, academic_year_id, invoice_no, title,
			                  amount, currency, month, year, due_at, status, paid_amount, adjustment_amount, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, 'May Fee', 5000, 'INR', 'May', 2025, NOW()+interval '10 days', 'unpaid', 0, 0, NOW(), NOW())
		`, store.NewID("fee"), testSchoolID, sid, classID, testYearID, "INV-"+store.NewID(""))
		require.NoError(t, err)
	}

	// ─── Build handler with MemStore (for composite endpoint) ──────────
	s := &store.MemStore{}
	// Load from PG into MemStore for the composite handler
	s.AcademicYears = []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}}

	// For this integration test, we test the PG dashboard handler directly
	pgHandler := dashboard.NewPG(pool, rdb, s)

	// ─── Test: First call (cache miss) ─────────────────────────────────
	start := time.Now()
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", "/api/analytics/dashboard?academic_year_id="+testYearID, nil)
	r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
		SchoolID:             testSchoolID,
		UserID:               "test_user",
		Role:                 "admin",
		ActiveAcademicYearID: testYearID,
	}))
	pgHandler.Get(w, r)
	firstCallDuration := time.Since(start)

	require.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "MISS", w.Header().Get("X-Cache"))
	assert.Less(t, firstCallDuration, 200*time.Millisecond,
		"first call should complete in <200ms, took %v", firstCallDuration)

	// Parse response
	var body api.ServiceResult
	err := json.Unmarshal(w.Body.Bytes(), &body)
	require.NoError(t, err)
	assert.True(t, body.Ok)

	// Verify data
	dataJSON, _ := json.Marshal(body.Data)
	var result map[string]any
	require.NoError(t, json.Unmarshal(dataJSON, &result))

	overview := result["overview"].(map[string]any)
	assert.Equal(t, float64(5), overview["totalStudents"])
	assert.Equal(t, float64(2), overview["totalTeachers"])

	attDetailed := overview["attendanceDetailed"].(map[string]any)
	assert.Equal(t, float64(3), attDetailed["present"])
	assert.Equal(t, float64(2), attDetailed["absent"])

	assert.Equal(t, float64(1), overview["pendingLeave"])

	// ─── Test: Second call (cache hit) ─────────────────────────────────
	start2 := time.Now()
	w2 := httptest.NewRecorder()
	r2 := httptest.NewRequest("GET", "/api/analytics/dashboard?academic_year_id="+testYearID, nil)
	r2 = r2.WithContext(api.WithContext(r2.Context(), &api.RequestContext{
		SchoolID:             testSchoolID,
		UserID:               "test_user",
		Role:                 "admin",
		ActiveAcademicYearID: testYearID,
	}))
	pgHandler.Get(w2, r2)
	secondCallDuration := time.Since(start2)

	assert.Equal(t, http.StatusOK, w2.Code)
	assert.Equal(t, "HIT", w2.Header().Get("X-Cache"))
	assert.Less(t, secondCallDuration, 20*time.Millisecond,
		"cache hit should complete in <20ms, took %v", secondCallDuration)

	// ─── Cleanup Redis ─────────────────────────────────────────────────
	_, _ = rdb.Del(ctx, fmt.Sprintf("dash:%s:%s", testSchoolID, testYearID))
}
