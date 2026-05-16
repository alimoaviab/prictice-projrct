package repo

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ClassRepo provides direct PG access for class operations.
type ClassRepo struct {
	pool  *pgxpool.Pool
	cache *cache.Client
}

func NewClassRepo(pool *pgxpool.Pool, c *cache.Client) *ClassRepo {
	return &ClassRepo{pool: pool, cache: c}
}

// List returns all classes for a school/year (typically <50, no pagination needed).
func (r *ClassRepo) List(ctx context.Context, schoolID, yearID string) ([]store.Class, error) {
	cacheKey := fmt.Sprintf("classes:%s:%s", schoolID, yearID)

	if r.cache != nil && r.cache.Available() {
		cached, _ := r.cache.Get(ctx, cacheKey)
		if cached != nil {
			var classes []store.Class
			if json.Unmarshal(cached, &classes) == nil {
				return classes, nil
			}
		}
	}

	query := `
		SELECT c.id, c.school_id, c.academic_year_id, c.name, COALESCE(c.code,''),
		       COALESCE(c.section,''), c.capacity, COALESCE(c.class_teacher_id,''),
		       c.status, c.created_at, c.updated_at,
		       (SELECT COUNT(*) FROM students s WHERE s.class_id = c.id AND s.school_id = c.school_id AND s.status='active') AS student_count
		FROM classes c
		WHERE c.school_id = $1 AND ($2 = '' OR c.academic_year_id = $2)
		ORDER BY c.name ASC
	`

	rows, err := r.pool.Query(ctx, query, schoolID, yearID)
	if err != nil {
		return nil, fmt.Errorf("list classes: %w", err)
	}
	defer rows.Close()

	classes := make([]store.Class, 0, 30)
	for rows.Next() {
		var c store.Class
		err := rows.Scan(
			&c.ID, &c.SchoolID, &c.AcademicYearID, &c.Name, &c.Code,
			&c.Section, &c.Capacity, &c.ClassTeacherID,
			&c.Status, &c.CreatedAt, &c.UpdatedAt, &c.StudentCount,
		)
		if err != nil {
			log.Printf("[class-repo] scan error: %v", err)
			continue
		}
		classes = append(classes, c)
	}

	if r.cache != nil && r.cache.Available() {
		data, _ := json.Marshal(classes)
		_ = r.cache.Set(ctx, cacheKey, data, 30*time.Minute)
	}

	return classes, nil
}

// GetByID returns a single class.
func (r *ClassRepo) GetByID(ctx context.Context, id, schoolID string) (*store.Class, error) {
	var c store.Class
	err := r.pool.QueryRow(ctx, `
		SELECT id, school_id, academic_year_id, name, COALESCE(code,''),
		       COALESCE(section,''), capacity, COALESCE(class_teacher_id,''),
		       status, created_at, updated_at
		FROM classes WHERE id=$1 AND school_id=$2
	`, id, schoolID).Scan(
		&c.ID, &c.SchoolID, &c.AcademicYearID, &c.Name, &c.Code,
		&c.Section, &c.Capacity, &c.ClassTeacherID,
		&c.Status, &c.CreatedAt, &c.UpdatedAt,
	)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get class: %w", err)
	}
	return &c, nil
}

// Create inserts a new class.
func (r *ClassRepo) Create(ctx context.Context, c *store.Class) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO classes (id, school_id, academic_year_id, name, code, section,
		                     capacity, class_teacher_id, status, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
	`, c.ID, c.SchoolID, c.AcademicYearID, c.Name, c.Code, c.Section,
		c.Capacity, c.ClassTeacherID, c.Status, c.CreatedAt, c.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create class: %w", err)
	}
	r.invalidate(ctx, c.SchoolID, c.AcademicYearID)
	return nil
}

// Update modifies an existing class.
func (r *ClassRepo) Update(ctx context.Context, c *store.Class) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE classes SET name=$3, code=$4, section=$5, capacity=$6,
		       class_teacher_id=$7, status=$8, updated_at=$9
		WHERE id=$1 AND school_id=$2
	`, c.ID, c.SchoolID, c.Name, c.Code, c.Section, c.Capacity,
		c.ClassTeacherID, c.Status, time.Now())
	if err != nil {
		return fmt.Errorf("update class: %w", err)
	}
	r.invalidate(ctx, c.SchoolID, c.AcademicYearID)
	return nil
}

// Delete removes a class.
func (r *ClassRepo) Delete(ctx context.Context, id, schoolID string) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM classes WHERE id=$1 AND school_id=$2", id, schoolID)
	if err != nil {
		return fmt.Errorf("delete class: %w", err)
	}
	r.invalidate(ctx, schoolID, "")
	return nil
}

func (r *ClassRepo) invalidate(ctx context.Context, schoolID, yearID string) {
	if r.cache == nil || !r.cache.Available() {
		return
	}
	_, _ = r.cache.Del(ctx, fmt.Sprintf("classes:%s:%s", schoolID, yearID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("dash:%s:%s", schoolID, yearID))
	_, _ = r.cache.Del(ctx, fmt.Sprintf("composite:%s:%s", schoolID, yearID))
}
