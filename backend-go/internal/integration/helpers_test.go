// Package integration provides end-to-end tests against real PostgreSQL and Redis.
//
// Requirements:
//   - TEST_DATABASE_URL env var pointing to a test PostgreSQL instance
//   - TEST_REDIS_URL env var pointing to a test Redis instance
//
// Run: TEST_DATABASE_URL=postgres://... TEST_REDIS_URL=redis://... go test ./internal/integration/ -v -count=1
package integration

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/require"
)

func getTestDBURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		url = os.Getenv("DATABASE_URL")
	}
	if url == "" {
		t.Skip("TEST_DATABASE_URL not set — skipping integration test")
	}
	return url
}

func getTestRedisURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("TEST_REDIS_URL")
	if url == "" {
		url = os.Getenv("REDIS_URL")
	}
	if url == "" {
		t.Skip("TEST_REDIS_URL not set — skipping integration test")
	}
	return url
}

func newTestPool(t *testing.T) *pgxpool.Pool {
	t.Helper()
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, getTestDBURL(t))
	require.NoError(t, err)
	t.Cleanup(func() { pool.Close() })
	return pool
}

func newTestRedis(t *testing.T) *cache.Client {
	t.Helper()
	c := cache.New(getTestRedisURL(t))
	t.Cleanup(func() { _ = c.Close() })
	return c
}

// ─── Test Data Helpers ───────────────────────────────────────────────────

const testSchoolID = "test_school_integ"
const testYearID = "test_ay_integ"

func createTestSchool(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()
	_, err := pool.Exec(ctx, `
		INSERT INTO schools (id, school_id, name, code, status, created_at, updated_at)
		VALUES ($1, $1, 'Integration Test School', 'ITS', 'active', NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`, testSchoolID)
	require.NoError(t, err)

	_, err = pool.Exec(ctx, `
		INSERT INTO academic_years (id, school_id, year, start_date, end_date, is_active, status, created_at, updated_at)
		VALUES ($1, $2, '2025-2026', '2025-04-01', '2026-03-31', true, 'active', NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`, testYearID, testSchoolID)
	require.NoError(t, err)
}

func createTestStudents(t *testing.T, pool *pgxpool.Pool, n int) []string {
	t.Helper()
	ctx := context.Background()
	ids := make([]string, n)
	for i := 0; i < n; i++ {
		id := fmt.Sprintf("test_stu_%d_%d", i, time.Now().UnixNano())
		ids[i] = id
		_, err := pool.Exec(ctx, `
			INSERT INTO students (id, school_id, academic_year_id, admission_no, first_name, last_name,
			                      class_id, section, status, guardian_name, guardian_phone, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'A', 'active', 'Parent', '9999999999', NOW(), NOW())
		`, id, testSchoolID, testYearID,
			fmt.Sprintf("ADM-%05d", i+1),
			fmt.Sprintf("Student%d", i+1),
			fmt.Sprintf("Last%d", i+1),
			"test_cls_integ",
		)
		require.NoError(t, err)
	}
	return ids
}

func createTestTeachers(t *testing.T, pool *pgxpool.Pool, n int) []string {
	t.Helper()
	ctx := context.Background()
	ids := make([]string, n)
	for i := 0; i < n; i++ {
		id := fmt.Sprintf("test_tch_%d_%d", i, time.Now().UnixNano())
		ids[i] = id
		_, err := pool.Exec(ctx, `
			INSERT INTO teachers (id, school_id, employee_no, first_name, last_name, email, phone, status, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, '1234567890', 'active', NOW(), NOW())
		`, id, testSchoolID, fmt.Sprintf("EMP-%05d", i+1),
			fmt.Sprintf("Teacher%d", i+1), fmt.Sprintf("T%d", i+1),
			fmt.Sprintf("teacher%d@test.com", i+1),
		)
		require.NoError(t, err)
	}
	return ids
}

func createTestClass(t *testing.T, pool *pgxpool.Pool) string {
	t.Helper()
	ctx := context.Background()
	id := "test_cls_integ"
	_, err := pool.Exec(ctx, `
		INSERT INTO classes (id, school_id, academic_year_id, name, status, capacity, created_at, updated_at)
		VALUES ($1, $2, $3, 'Test Class 10A', 'active', 50, NOW(), NOW())
		ON CONFLICT (id) DO NOTHING
	`, id, testSchoolID, testYearID)
	require.NoError(t, err)
	return id
}

func createTestLeave(t *testing.T, pool *pgxpool.Pool, status string) string {
	t.Helper()
	ctx := context.Background()
	id := store.NewID("lv")
	_, err := pool.Exec(ctx, `
		INSERT INTO leaves (id, school_id, requester_type, requester_id, requester_name, leave_type,
		                    start_date, end_date, reason, status, created_at, updated_at)
		VALUES ($1, $2, 'teacher', 'tch_1', 'Teacher 1', 'sick', NOW(), NOW()+interval '1 day', 'Not feeling well', $3, NOW(), NOW())
	`, id, testSchoolID, status)
	require.NoError(t, err)
	return id
}

func cleanupTestData(t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	ctx := context.Background()
	tables := []string{
		"fee_payments", "fees", "attendance", "leaves", "audit_logs",
		"students", "teachers", "classes", "academic_years", "schools",
	}
	for _, table := range tables {
		_, _ = pool.Exec(ctx, fmt.Sprintf("DELETE FROM %s WHERE school_id = $1", table), testSchoolID)
	}
}
