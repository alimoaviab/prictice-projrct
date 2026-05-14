package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/domain/attendance"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBulkAttendanceMark_Success(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	createTestSchool(t, pool)
	classID := createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 10)

	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}},
	}
	handler := attendance.NewPG(pool, rdb, s)

	// Build request body
	records := make([]map[string]string, len(studentIDs))
	for i, sid := range studentIDs {
		records[i] = map[string]string{"student_id": sid, "status": "present"}
	}
	body, _ := json.Marshal(map[string]any{
		"class_id": classID,
		"date":     time.Now().Format("2006-01-02"),
		"period":   1,
		"records":  records,
	})

	// Act
	start := time.Now()
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/attendance/mark", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
		SchoolID: testSchoolID, UserID: "test_user", Role: "admin",
		ActiveAcademicYearID: testYearID,
	}))
	handler.MarkBulkPG(w, r)
	duration := time.Since(start)

	// Assert
	require.Equal(t, http.StatusOK, w.Code)
	assert.Less(t, duration, 100*time.Millisecond,
		"bulk mark of 10 students should take <100ms, took %v", duration)

	var resp api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp.Ok)

	dataJSON, _ := json.Marshal(resp.Data)
	var result map[string]any
	require.NoError(t, json.Unmarshal(dataJSON, &result))
	assert.Equal(t, float64(10), result["saved"])
	assert.Equal(t, float64(0), result["failed"])

	// Verify in DB
	var count int
	today := time.Now().Format("2006-01-02")
	err := pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM attendance WHERE school_id=$1 AND class_id=$2 AND date=$3::date
	`, testSchoolID, classID, today).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 10, count)
}

func TestBulkAttendanceMark_Upsert(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	createTestSchool(t, pool)
	classID := createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 10)

	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}},
	}
	handler := attendance.NewPG(pool, rdb, s)
	today := time.Now().Format("2006-01-02")

	makeRequest := func(records []map[string]string) *httptest.ResponseRecorder {
		body, _ := json.Marshal(map[string]any{
			"class_id": classID, "date": today, "period": 1, "records": records,
		})
		w := httptest.NewRecorder()
		r := httptest.NewRequest("POST", "/api/attendance/mark", bytes.NewReader(body))
		r.Header.Set("Content-Type", "application/json")
		r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
			SchoolID: testSchoolID, UserID: "test_user", Role: "admin",
			ActiveAcademicYearID: testYearID,
		}))
		handler.MarkBulkPG(w, r)
		return w
	}

	// First mark: all present
	records1 := make([]map[string]string, len(studentIDs))
	for i, sid := range studentIDs {
		records1[i] = map[string]string{"student_id": sid, "status": "present"}
	}
	w1 := makeRequest(records1)
	require.Equal(t, http.StatusOK, w1.Code)

	// Second mark: change 3 to absent (ON CONFLICT DO UPDATE)
	records2 := make([]map[string]string, 3)
	for i := 0; i < 3; i++ {
		records2[i] = map[string]string{"student_id": studentIDs[i], "status": "absent"}
	}
	w2 := makeRequest(records2)
	require.Equal(t, http.StatusOK, w2.Code)

	// Verify: still 10 total records (not 13), 3 are absent
	var totalCount, absentCount int
	err := pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM attendance WHERE school_id=$1 AND class_id=$2 AND date=$3::date
	`, testSchoolID, classID, today).Scan(&totalCount)
	require.NoError(t, err)
	assert.Equal(t, 10, totalCount, "should have 10 records total (upsert, not duplicate)")

	err = pool.QueryRow(ctx, `
		SELECT COUNT(*) FROM attendance WHERE school_id=$1 AND class_id=$2 AND date=$3::date AND status='absent'
	`, testSchoolID, classID, today).Scan(&absentCount)
	require.NoError(t, err)
	assert.Equal(t, 3, absentCount, "3 records should be absent after upsert")
}

func TestBulkAttendanceMark_CacheInvalidated(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	createTestSchool(t, pool)
	classID := createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 3)

	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}},
	}
	handler := attendance.NewPG(pool, rdb, s)
	today := time.Now().Format("2006-01-02")

	// Pre-populate cache
	cacheKey := fmt.Sprintf("att:today:%s:%s", testSchoolID, today)
	_ = rdb.Set(ctx, cacheKey, []byte(`{"cached": true}`), 5*time.Minute)
	exists, _ := rdb.Exists(ctx, cacheKey)
	require.True(t, exists, "cache should exist before marking")

	// Mark attendance
	records := make([]map[string]string, len(studentIDs))
	for i, sid := range studentIDs {
		records[i] = map[string]string{"student_id": sid, "status": "present"}
	}
	body, _ := json.Marshal(map[string]any{
		"class_id": classID, "date": today, "period": 1, "records": records,
	})
	w := httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/attendance/mark", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
		SchoolID: testSchoolID, UserID: "test_user", Role: "admin",
		ActiveAcademicYearID: testYearID,
	}))
	handler.MarkBulkPG(w, r)
	require.Equal(t, http.StatusOK, w.Code)

	// Assert: cache key should be invalidated
	exists, _ = rdb.Exists(ctx, cacheKey)
	assert.False(t, exists, "attendance cache should be invalidated after marking")
}

func TestAttendanceSheet_JoinQuery(t *testing.T) {
	pool := newTestPool(t)
	rdb := newTestRedis(t)
	ctx := context.Background()

	cleanupTestData(t, pool)
	t.Cleanup(func() { cleanupTestData(t, pool) })

	createTestSchool(t, pool)
	classID := createTestClass(t, pool)
	studentIDs := createTestStudents(t, pool, 5)

	// Mark 3 students as present
	today := time.Now().Format("2006-01-02")
	for i := 0; i < 3; i++ {
		_, err := pool.Exec(ctx, `
			INSERT INTO attendance (id, school_id, academic_year_id, student_id, class_id, date, period, status, marked_by, source, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6::date, 1, 'present', 'test', 'manual', NOW(), NOW())
		`, store.NewID("att"), testSchoolID, testYearID, studentIDs[i], classID, today)
		require.NoError(t, err)
	}

	s := &store.MemStore{
		AcademicYears: []*store.AcademicYear{{ID: testYearID, SchoolID: testSchoolID, IsActive: true, Status: "active"}},
	}
	handler := attendance.NewPG(pool, rdb, s)

	// Act: GET /api/attendance/sheet
	w := httptest.NewRecorder()
	r := httptest.NewRequest("GET", fmt.Sprintf("/api/attendance/sheet?class_id=%s&date=%s", classID, today), nil)
	r = r.WithContext(api.WithContext(r.Context(), &api.RequestContext{
		SchoolID: testSchoolID, UserID: "test_user", Role: "admin",
		ActiveAcademicYearID: testYearID,
	}))
	handler.Sheet(w, r)

	require.Equal(t, http.StatusOK, w.Code)

	var resp api.ServiceResult
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.True(t, resp.Ok)

	dataJSON, _ := json.Marshal(resp.Data)
	var sheet map[string]any
	require.NoError(t, json.Unmarshal(dataJSON, &sheet))

	// Verify all 5 students returned
	students := sheet["students"].([]any)
	assert.Equal(t, 5, len(students))

	// Verify summary
	summary := sheet["summary"].(map[string]any)
	assert.Equal(t, float64(5), summary["total"])
	assert.Equal(t, float64(3), summary["marked"])
	assert.Equal(t, float64(3), summary["present"])
}
