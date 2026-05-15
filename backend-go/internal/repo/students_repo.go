// Package repo provides direct PostgreSQL repositories that replace MemStore.
//
// Each repository:
//   1. Checks Redis cache (where applicable)
//   2. Queries PostgreSQL directly
//   3. Caches the result in Redis
//   4. Invalidates related caches on mutations
//
// This eliminates O(n) in-memory scans and the single RWMutex bottleneck.
package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ─── List Options ────────────────────────────────────────────────────────

// ListOpts configures pagination, filtering, and search for list queries.
type ListOpts struct {
	Page    int
	PerPage int
	Status  string
	ClassID string
	Search  string
}

func (o ListOpts) Offset() int {
	if o.Page < 1 {
		return 0
	}
	return (o.Page - 1) * o.Limit()
}

func (o ListOpts) Limit() int {
	if o.PerPage < 1 {
		return 25
	}
	if o.PerPage > 200 {
		return 200
	}
	return o.PerPage
}

// ─── Students Repository ─────────────────────────────────────────────────

// StudentRepo provides direct PG access for student operations.
type StudentRepo struct {
	pool  *pgxpool.Pool
	cache *cache.Client
}

// NewStudentRepo creates a student repository.
func NewStudentRepo(pool *pgxpool.Pool, c *cache.Client) *StudentRepo {
	return &StudentRepo{pool: pool, cache: c}
}

// List returns paginated students filtered by school, year, and options.
// Checks Redis cache first; on miss, queries PG and caches the result.
func (r *StudentRepo) List(ctx context.Context, schoolID, yearID string, opts ListOpts) ([]store.Student, int, error) {
	cacheKey := fmt.Sprintf("students:%s:%s:p%d:pp%d:s%s:c%s:q%s",
		schoolID, yearID, opts.Page, opts.Limit(), opts.Status, opts.ClassID, opts.Search)

	// ─── Redis cache check ─────────────────────────────────────────────
	if r.cache != nil && r.cache.Available() {
		cached, err := r.cache.Get(ctx, cacheKey)
		if err == nil && cached != nil {
			var result cachedStudentList
			if json.Unmarshal(cached, &result) == nil {
				return result.Items, result.Total, nil
			}
		}
	}

	// ─── Build query ───────────────────────────────────────────────────
	where := []string{"school_id = $1"}
	args := []any{schoolID}
	argIdx := 2

	if yearID != "" {
		where = append(where, fmt.Sprintf("academic_year_id = $%d", argIdx))
		args = append(args, yearID)
		argIdx++
	}
	if opts.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, opts.Status)
		argIdx++
	}
	if opts.ClassID != "" {
		where = append(where, fmt.Sprintf("class_id = $%d", argIdx))
		args = append(args, opts.ClassID)
		argIdx++
	}
	if opts.Search != "" {
		where = append(where, fmt.Sprintf(
			"(LOWER(first_name || ' ' || last_name) LIKE $%d OR LOWER(admission_no) LIKE $%d)",
			argIdx, argIdx,
		))
		args = append(args, "%"+strings.ToLower(opts.Search)+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	// ─── Count query ───────────────────────────────────────────────────
	countQuery := "SELECT COUNT(*) FROM students WHERE " + whereClause
	var total int
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count students: %w", err)
	}

	// ─── Data query with pagination ────────────────────────────────────
	dataQuery := fmt.Sprintf(`
		SELECT id, school_id, academic_year_id, admission_no, first_name, last_name,
		       class_id, section, status, roll_no, gender, COALESCE(user_id, '') AS user_id, enrolled_at, created_at, updated_at,
		       COALESCE(guardian_name, '') AS guardian_name,
		       COALESCE(guardian_phone, '') AS guardian_phone,
		       COALESCE(guardian_email, '') AS guardian_email
		FROM students
		WHERE %s
		ORDER BY first_name ASC, last_name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, opts.Limit(), opts.Offset())

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list students: %w", err)
	}
	defer rows.Close()

	students := make([]store.Student, 0, opts.Limit())
	for rows.Next() {
		var s store.Student
		var guardianName, guardianPhone, guardianEmail string
		err := rows.Scan(
			&s.ID, &s.SchoolID, &s.AcademicYearID, &s.AdmissionNo,
			&s.FirstName, &s.LastName, &s.ClassID, &s.Section,
			&s.Status, &s.RollNo, &s.Gender, &s.UserID, &s.EnrolledAt,
			&s.CreatedAt, &s.UpdatedAt,
			&guardianName, &guardianPhone, &guardianEmail,
		)
		if err != nil {
			log.Printf("[student-repo] scan error: %v", err)
			continue
		}
		s.Guardian = store.Guardian{Name: guardianName, Phone: guardianPhone, Email: guardianEmail}
		students = append(students, s)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows iteration: %w", err)
	}

	// ─── Cache result (10 min TTL) ─────────────────────────────────────
	if r.cache != nil && r.cache.Available() {
		cached := cachedStudentList{Items: students, Total: total}
		if data, err := json.Marshal(cached); err == nil {
			_ = r.cache.Set(ctx, cacheKey, data, 10*time.Minute)
		}
	}

	return students, total, nil
}

type cachedStudentList struct {
	Items []store.Student `json:"items"`
	Total int             `json:"total"`
}

// GetByID returns a single student by ID.
func (r *StudentRepo) GetByID(ctx context.Context, id, schoolID string) (*store.Student, error) {
	cacheKey := fmt.Sprintf("student:%s:%s", schoolID, id)

	// Redis check
	if r.cache != nil && r.cache.Available() {
		cached, err := r.cache.Get(ctx, cacheKey)
		if err == nil && cached != nil {
			var s store.Student
			if json.Unmarshal(cached, &s) == nil {
				return &s, nil
			}
		}
	}

	var s store.Student
	var guardianName, guardianPhone, guardianEmail string
	err := r.pool.QueryRow(ctx, `
		SELECT id, school_id, academic_year_id, admission_no, first_name, last_name,
		       class_id, section, status, roll_no, gender, COALESCE(user_id, '') AS user_id, enrolled_at, created_at, updated_at,
		       COALESCE(guardian_name, '') AS guardian_name,
		       COALESCE(guardian_phone, '') AS guardian_phone,
		       COALESCE(guardian_email, '') AS guardian_email
		FROM students
		WHERE id = $1 AND school_id = $2
	`, id, schoolID).Scan(
		&s.ID, &s.SchoolID, &s.AcademicYearID, &s.AdmissionNo,
		&s.FirstName, &s.LastName, &s.ClassID, &s.Section,
		&s.Status, &s.RollNo, &s.Gender, &s.UserID, &s.EnrolledAt,
		&s.CreatedAt, &s.UpdatedAt,
		&guardianName, &guardianPhone, &guardianEmail,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get student: %w", err)
	}
	s.Guardian = store.Guardian{Name: guardianName, Phone: guardianPhone, Email: guardianEmail}

	// Cache for 10 min
	if r.cache != nil && r.cache.Available() {
		if data, err := json.Marshal(s); err == nil {
			_ = r.cache.Set(ctx, cacheKey, data, 10*time.Minute)
		}
	}

	return &s, nil
}

// GetByUserID returns a single student by their associated user ID.
func (r *StudentRepo) GetByUserID(ctx context.Context, userID, schoolID string) (*store.Student, error) {
	var s store.Student
	var guardianName, guardianPhone, guardianEmail string
	err := r.pool.QueryRow(ctx, `
		SELECT id, school_id, academic_year_id, admission_no, first_name, last_name,
		       class_id, section, status, roll_no, gender, COALESCE(user_id, '') AS user_id, enrolled_at, created_at, updated_at,
		       COALESCE(guardian_name, '') AS guardian_name,
		       COALESCE(guardian_phone, '') AS guardian_phone,
		       COALESCE(guardian_email, '') AS guardian_email
		FROM students
		WHERE user_id = $1 AND school_id = $2
	`, userID, schoolID).Scan(
		&s.ID, &s.SchoolID, &s.AcademicYearID, &s.AdmissionNo,
		&s.FirstName, &s.LastName, &s.ClassID, &s.Section,
		&s.Status, &s.RollNo, &s.Gender, &s.UserID, &s.EnrolledAt,
		&s.CreatedAt, &s.UpdatedAt,
		&guardianName, &guardianPhone, &guardianEmail,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get student by user_id: %w", err)
	}
	s.Guardian = store.Guardian{Name: guardianName, Phone: guardianPhone, Email: guardianEmail}
	return &s, nil
}

// Create inserts a new student into PostgreSQL.
func (r *StudentRepo) Create(ctx context.Context, s *store.Student) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO students (id, school_id, academic_year_id, admission_no, first_name, last_name,
		                      class_id, section, status, roll_no, gender, guardian_name, guardian_phone,
		                      guardian_email, enrolled_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	`, s.ID, s.SchoolID, s.AcademicYearID, s.AdmissionNo, s.FirstName, s.LastName,
		s.ClassID, s.Section, s.Status, s.RollNo, s.Gender,
		s.Guardian.Name, s.Guardian.Phone, s.Guardian.Email,
		s.EnrolledAt, s.CreatedAt, s.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create student: %w", err)
	}

	r.invalidateStudentCaches(ctx, s.SchoolID, s.AcademicYearID)
	return nil
}

// Update modifies an existing student.
func (r *StudentRepo) Update(ctx context.Context, s *store.Student) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE students SET
			first_name = $3, last_name = $4, class_id = $5, section = $6,
			status = $7, roll_no = $8, gender = $9,
			guardian_name = $10, guardian_phone = $11, guardian_email = $12,
			updated_at = $13
		WHERE id = $1 AND school_id = $2
	`, s.ID, s.SchoolID,
		s.FirstName, s.LastName, s.ClassID, s.Section,
		s.Status, s.RollNo, s.Gender,
		s.Guardian.Name, s.Guardian.Phone, s.Guardian.Email,
		time.Now(),
	)
	if err != nil {
		return fmt.Errorf("update student: %w", err)
	}

	r.invalidateStudentCaches(ctx, s.SchoolID, s.AcademicYearID)
	// Also invalidate the individual cache
	if r.cache != nil && r.cache.Available() {
		_, _ = r.cache.Del(ctx, fmt.Sprintf("student:%s:%s", s.SchoolID, s.ID))
	}
	return nil
}

// Delete removes a student.
func (r *StudentRepo) Delete(ctx context.Context, id, schoolID string) error {
	// Get year ID for cache invalidation before deleting
	var yearID string
	_ = r.pool.QueryRow(ctx, "SELECT academic_year_id FROM students WHERE id=$1 AND school_id=$2", id, schoolID).Scan(&yearID)

	_, err := r.pool.Exec(ctx, "DELETE FROM students WHERE id = $1 AND school_id = $2", id, schoolID)
	if err != nil {
		return fmt.Errorf("delete student: %w", err)
	}

	r.invalidateStudentCaches(ctx, schoolID, yearID)
	if r.cache != nil && r.cache.Available() {
		_, _ = r.cache.Del(ctx, fmt.Sprintf("student:%s:%s", schoolID, id))
	}
	return nil
}

// invalidateStudentCaches removes all student-related caches for a school.
func (r *StudentRepo) invalidateStudentCaches(ctx context.Context, schoolID, yearID string) {
	if r.cache == nil || !r.cache.Available() {
		return
	}
	// Delete paginated list caches and dashboard
	_, _ = r.cache.DelPattern(ctx, fmt.Sprintf("students:%s:%s:*", schoolID, yearID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("dash:%s:%s", schoolID, yearID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("composite:%s:%s", schoolID, yearID))
}
