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

// TeacherRepo provides direct PG access for teacher operations.
type TeacherRepo struct {
	pool  *pgxpool.Pool
	cache *cache.Client
}

func NewTeacherRepo(pool *pgxpool.Pool, c *cache.Client) *TeacherRepo {
	return &TeacherRepo{pool: pool, cache: c}
}

// List returns paginated teachers.
func (r *TeacherRepo) List(ctx context.Context, schoolID, yearID string, opts ListOpts) ([]store.Teacher, int, error) {
	cacheKey := fmt.Sprintf("teachers:%s:%s:p%d:s%s:q%s", schoolID, yearID, opts.Page, opts.Status, opts.Search)

	if r.cache != nil && r.cache.Available() {
		cached, _ := r.cache.Get(ctx, cacheKey)
		if cached != nil {
			var result struct {
				Items []store.Teacher `json:"items"`
				Total int             `json:"total"`
			}
			if json.Unmarshal(cached, &result) == nil {
				return result.Items, result.Total, nil
			}
		}
	}

	where := []string{"school_id = $1"}
	args := []any{schoolID}
	argIdx := 2

	if yearID != "" {
		where = append(where, fmt.Sprintf("(academic_year_id = $%d OR academic_year_id = '' OR academic_year_id IS NULL)", argIdx))
		args = append(args, yearID)
		argIdx++
	}
	if opts.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, opts.Status)
		argIdx++
	}
	if opts.Search != "" {
		where = append(where, fmt.Sprintf("LOWER(first_name || ' ' || COALESCE(last_name,'')) LIKE $%d", argIdx))
		args = append(args, "%"+strings.ToLower(opts.Search)+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM teachers WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count teachers: %w", err)
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, school_id, COALESCE(academic_year_id,''), employee_no, first_name,
		       COALESCE(last_name,''), email, phone, COALESCE(qualification,''),
		       status, COALESCE(user_id, ''), created_at, updated_at
		FROM teachers WHERE %s
		ORDER BY first_name ASC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, opts.Limit(), opts.Offset())

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list teachers: %w", err)
	}
	defer rows.Close()

	teachers := make([]store.Teacher, 0, opts.Limit())
	for rows.Next() {
		var t store.Teacher
		err := rows.Scan(
			&t.ID, &t.SchoolID, &t.AcademicYearID, &t.EmployeeNo, &t.FirstName,
			&t.LastName, &t.Email, &t.Phone, &t.Qualification,
			&t.Status, &t.UserID, &t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			log.Printf("[teacher-repo] scan error: %v", err)
			continue
		}
		teachers = append(teachers, t)
	}

	if r.cache != nil && r.cache.Available() {
		data, _ := json.Marshal(struct {
			Items []store.Teacher `json:"items"`
			Total int             `json:"total"`
		}{teachers, total})
		_ = r.cache.Set(ctx, cacheKey, data, 30*time.Minute)
	}

	return teachers, total, nil
}

// GetByID returns a single teacher.
func (r *TeacherRepo) GetByID(ctx context.Context, id, schoolID string) (*store.Teacher, error) {
	var t store.Teacher
	err := r.pool.QueryRow(ctx, `
		SELECT id, school_id, COALESCE(academic_year_id,''), employee_no, first_name,
		       COALESCE(last_name,''), email, phone, COALESCE(qualification,''),
		       status, COALESCE(user_id, ''), created_at, updated_at
		FROM teachers WHERE id = $1 AND school_id = $2
	`, id, schoolID).Scan(
		&t.ID, &t.SchoolID, &t.AcademicYearID, &t.EmployeeNo, &t.FirstName,
		&t.LastName, &t.Email, &t.Phone, &t.Qualification,
		&t.Status, &t.UserID, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get teacher: %w", err)
	}
	return &t, nil
}

// GetByUserID returns a single teacher by their associated user ID.
func (r *TeacherRepo) GetByUserID(ctx context.Context, userID, schoolID string) (*store.Teacher, error) {
	var t store.Teacher
	err := r.pool.QueryRow(ctx, `
		SELECT id, school_id, COALESCE(academic_year_id,''), employee_no, first_name,
		       COALESCE(last_name,''), email, phone, COALESCE(qualification,''),
		       status, COALESCE(user_id, ''), joined_at, created_at, updated_at
		FROM teachers WHERE user_id = $1 AND school_id = $2
	`, userID, schoolID).Scan(
		&t.ID, &t.SchoolID, &t.AcademicYearID, &t.EmployeeNo, &t.FirstName,
		&t.LastName, &t.Email, &t.Phone, &t.Qualification,
		&t.Status, &t.UserID, &t.JoinedAt, &t.CreatedAt, &t.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get teacher by user_id: %w", err)
	}
	return &t, nil
}

// Create inserts a new teacher.
func (r *TeacherRepo) Create(ctx context.Context, t *store.Teacher) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO teachers (id, school_id, academic_year_id, employee_no, first_name, last_name,
		                      email, phone, qualification, status, user_id, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
	`, t.ID, t.SchoolID, t.AcademicYearID, t.EmployeeNo, t.FirstName, t.LastName,
		t.Email, t.Phone, t.Qualification, t.Status, t.UserID, t.CreatedAt, t.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create teacher: %w", err)
	}
	r.invalidate(ctx, t.SchoolID, t.AcademicYearID)
	return nil
}

// Update modifies an existing teacher.
func (r *TeacherRepo) Update(ctx context.Context, t *store.Teacher) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE teachers SET first_name=$3, last_name=$4, email=$5, phone=$6,
		       qualification=$7, status=$8, user_id=$9, updated_at=$10
		WHERE id=$1 AND school_id=$2
	`, t.ID, t.SchoolID, t.FirstName, t.LastName, t.Email, t.Phone,
		t.Qualification, t.Status, t.UserID, time.Now())
	if err != nil {
		return fmt.Errorf("update teacher: %w", err)
	}
	r.invalidate(ctx, t.SchoolID, t.AcademicYearID)
	return nil
}

// Delete removes a teacher.
func (r *TeacherRepo) Delete(ctx context.Context, id, schoolID string) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM teachers WHERE id=$1 AND school_id=$2", id, schoolID)
	if err != nil {
		return fmt.Errorf("delete teacher: %w", err)
	}
	r.invalidate(ctx, schoolID, "")
	return nil
}

func (r *TeacherRepo) invalidate(ctx context.Context, schoolID, yearID string) {
	if r.cache == nil || !r.cache.Available() {
		return
	}
	_, _ = r.cache.DelPattern(ctx, fmt.Sprintf("teachers:%s:*", schoolID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("dash:%s:%s", schoolID, yearID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("composite:%s:%s", schoolID, yearID))
}
