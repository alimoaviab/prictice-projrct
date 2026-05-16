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

// FeeListOpts configures fee list queries.
type FeeListOpts struct {
	Page      int
	PerPage   int
	StudentID string
	ClassID   string
	Month     string
	Status    string
}

func (o FeeListOpts) Offset() int {
	if o.Page < 1 {
		return 0
	}
	return (o.Page - 1) * o.Limit()
}

func (o FeeListOpts) Limit() int {
	if o.PerPage < 1 {
		return 25
	}
	if o.PerPage > 200 {
		return 200
	}
	return o.PerPage
}

// FeeSummary is the aggregated fee collection stats.
type FeeSummary struct {
	TotalExpected float64 `json:"total_expected"`
	TotalPaid     float64 `json:"total_paid"`
	Percentage    int     `json:"percentage"`
	PaidCount     int     `json:"paid_count"`
	UnpaidCount   int     `json:"unpaid_count"`
	PartialCount  int     `json:"partial_count"`
	TotalInvoices int     `json:"total_invoices"`
}

// FeeGenJob is the payload for async fee generation.
type FeeGenJob struct {
	SchoolID       string   `json:"school_id"`
	AcademicYearID string   `json:"academic_year_id"`
	ClassIDs       []string `json:"class_ids"`
	Month          string   `json:"month"`
	Year           int      `json:"year"`
	GeneratedBy    string   `json:"generated_by"`
}

// FeeRepo provides direct PG access for fee operations.
type FeeRepo struct {
	pool  *pgxpool.Pool
	cache *cache.Client
}

func NewFeeRepo(pool *pgxpool.Pool, c *cache.Client) *FeeRepo {
	return &FeeRepo{pool: pool, cache: c}
}

// ListBySchool returns paginated fees for a school.
func (r *FeeRepo) ListBySchool(ctx context.Context, schoolID, yearID string, opts FeeListOpts) ([]store.Fee, int, error) {
	where := []string{"school_id = $1"}
	args := []any{schoolID}
	argIdx := 2

	if yearID != "" {
		where = append(where, fmt.Sprintf("academic_year_id = $%d", argIdx))
		args = append(args, yearID)
		argIdx++
	}
	if opts.StudentID != "" {
		where = append(where, fmt.Sprintf("student_id = $%d", argIdx))
		args = append(args, opts.StudentID)
		argIdx++
	}
	if opts.ClassID != "" {
		where = append(where, fmt.Sprintf("class_id = $%d", argIdx))
		args = append(args, opts.ClassID)
		argIdx++
	}
	if opts.Month != "" {
		where = append(where, fmt.Sprintf("month = $%d", argIdx))
		args = append(args, opts.Month)
		argIdx++
	}
	if opts.Status != "" {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, opts.Status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM fees WHERE "+whereClause, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count fees: %w", err)
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, school_id, student_id, COALESCE(class_id,''), COALESCE(academic_year_id,''),
		       invoice_no, title, amount, COALESCE(currency,'INR'), month, year,
		       due_at, status, paid_amount, COALESCE(adjustment_amount,0),
		       created_at, updated_at
		FROM fees WHERE %s
		ORDER BY due_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, opts.Limit(), opts.Offset())

	rows, err := r.pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list fees: %w", err)
	}
	defer rows.Close()

	fees := make([]store.Fee, 0, opts.Limit())
	for rows.Next() {
		var f store.Fee
		err := rows.Scan(
			&f.ID, &f.SchoolID, &f.StudentID, &f.ClassID, &f.AcademicYearID,
			&f.InvoiceNo, &f.Title, &f.Amount, &f.Currency, &f.Month, &f.Year,
			&f.DueAt, &f.Status, &f.PaidAmount, &f.AdjustmentAmount,
			&f.CreatedAt, &f.UpdatedAt,
		)
		if err != nil {
			log.Printf("[fee-repo] scan error: %v", err)
			continue
		}
		fees = append(fees, f)
	}

	return fees, total, nil
}

// GetSummary returns aggregated fee stats from the materialized view.
func (r *FeeRepo) GetSummary(ctx context.Context, schoolID, yearID string) (*FeeSummary, error) {
	cacheKey := fmt.Sprintf("fees:summary:%s:%s", schoolID, yearID)

	if r.cache != nil && r.cache.Available() {
		cached, _ := r.cache.Get(ctx, cacheKey)
		if cached != nil {
			var s FeeSummary
			if json.Unmarshal(cached, &s) == nil {
				return &s, nil
			}
		}
	}

	var s FeeSummary
	err := r.pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_expected), 0),
		       COALESCE(SUM(total_collected), 0),
		       COALESCE(SUM(total_invoices), 0),
		       COALESCE(SUM(paid_count), 0),
		       COALESCE(SUM(unpaid_count), 0),
		       COALESCE(SUM(partial_count), 0)
		FROM mv_fee_summary
		WHERE school_id = $1 AND academic_year_id = $2
	`, schoolID, yearID).Scan(
		&s.TotalExpected, &s.TotalPaid, &s.TotalInvoices,
		&s.PaidCount, &s.UnpaidCount, &s.PartialCount,
	)
	if err == pgx.ErrNoRows {
		return &FeeSummary{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("fee summary: %w", err)
	}

	if s.TotalExpected > 0 {
		s.Percentage = int((s.TotalPaid / s.TotalExpected) * 100)
	}

	if r.cache != nil && r.cache.Available() {
		data, _ := json.Marshal(s)
		_ = r.cache.Set(ctx, cacheKey, data, 15*time.Minute)
	}

	return &s, nil
}

// Create inserts a new fee record.
func (r *FeeRepo) Create(ctx context.Context, f *store.Fee) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO fees (id, school_id, student_id, class_id, academic_year_id,
		                  invoice_no, title, amount, currency, month, year,
		                  due_at, status, paid_amount, adjustment_amount,
		                  generated_at, generated_by, created_at, updated_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
	`, f.ID, f.SchoolID, f.StudentID, f.ClassID, f.AcademicYearID,
		f.InvoiceNo, f.Title, f.Amount, f.Currency, f.Month, f.Year,
		f.DueAt, f.Status, f.PaidAmount, f.AdjustmentAmount,
		f.GeneratedAt, f.GeneratedBy, f.CreatedAt, f.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create fee: %w", err)
	}
	r.invalidate(ctx, f.SchoolID, f.AcademicYearID)
	return nil
}

// RecordPayment updates paid_amount and recalculates status.
func (r *FeeRepo) RecordPayment(ctx context.Context, feeID string, amount float64, schoolID string) error {
	// Use a transaction to atomically update and recalculate
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Update paid_amount
	_, err = tx.Exec(ctx, `
		UPDATE fees SET
			paid_amount = paid_amount + $2,
			status = CASE
				WHEN (paid_amount + $2) >= (amount + COALESCE(adjustment_amount, 0)) THEN 'paid'
				WHEN (paid_amount + $2) > 0 THEN 'partial'
				ELSE 'unpaid'
			END,
			updated_at = NOW()
		WHERE id = $1 AND school_id = $3
	`, feeID, amount, schoolID)
	if err != nil {
		return fmt.Errorf("update fee payment: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	// Get year for cache invalidation
	var yearID string
	_ = r.pool.QueryRow(ctx, "SELECT academic_year_id FROM fees WHERE id=$1", feeID).Scan(&yearID)
	r.invalidate(ctx, schoolID, yearID)
	return nil
}

// GenerateFees bulk-inserts fee records for all students in given classes.
// Uses INSERT...ON CONFLICT to be idempotent (safe to retry).
func (r *FeeRepo) GenerateFees(ctx context.Context, job FeeGenJob, progressFn func(done, total int)) error {
	// Get all students in the target classes
	query := `
		SELECT id, class_id FROM students
		WHERE school_id = $1 AND academic_year_id = $2 AND status = 'active'
		AND class_id = ANY($3)
	`
	rows, err := r.pool.Query(ctx, query, job.SchoolID, job.AcademicYearID, job.ClassIDs)
	if err != nil {
		return fmt.Errorf("query students for fee gen: %w", err)
	}
	defer rows.Close()

	type studentInfo struct {
		ID      string
		ClassID string
	}
	var students []studentInfo
	for rows.Next() {
		var s studentInfo
		if err := rows.Scan(&s.ID, &s.ClassID); err != nil {
			continue
		}
		students = append(students, s)
	}

	if len(students) == 0 {
		return nil
	}

	// Get class fees for the target classes
	cfRows, err := r.pool.Query(ctx, `
		SELECT class_id, fee_type_id, amount FROM class_fees
		WHERE school_id = $1 AND academic_year_id = $2 AND class_id = ANY($3) AND status = 'active'
	`, job.SchoolID, job.AcademicYearID, job.ClassIDs)
	if err != nil {
		return fmt.Errorf("query class fees: %w", err)
	}
	defer cfRows.Close()

	type classFeeInfo struct {
		ClassID   string
		FeeTypeID string
		Amount    float64
	}
	classFeesByClass := make(map[string][]classFeeInfo)
	for cfRows.Next() {
		var cf classFeeInfo
		if err := cfRows.Scan(&cf.ClassID, &cf.FeeTypeID, &cf.Amount); err != nil {
			continue
		}
		classFeesByClass[cf.ClassID] = append(classFeesByClass[cf.ClassID], cf)
	}

	// Generate fees in batches of 50
	now := time.Now()
	total := len(students)
	done := 0
	batchSize := 50

	for i := 0; i < len(students); i += batchSize {
		end := i + batchSize
		if end > len(students) {
			end = len(students)
		}
		batch := students[i:end]

		tx, err := r.pool.Begin(ctx)
		if err != nil {
			return fmt.Errorf("begin batch tx: %w", err)
		}

		for _, stu := range batch {
			classFees := classFeesByClass[stu.ClassID]
			totalAmount := 0.0
			for _, cf := range classFees {
				totalAmount += cf.Amount
			}
			if totalAmount == 0 {
				done++
				continue
			}

			feeID := store.NewID("fee")
			invoiceNo := fmt.Sprintf("INV-%d%02d-%s", job.Year, monthNum(job.Month), feeID[4:14])

			_, err := tx.Exec(ctx, `
				INSERT INTO fees (id, school_id, student_id, class_id, academic_year_id,
				                  invoice_no, title, amount, currency, month, year,
				                  due_at, status, paid_amount, adjustment_amount,
				                  generated_at, generated_by, created_at, updated_at)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
				ON CONFLICT (school_id, student_id, month, year) WHERE academic_year_id IS NOT NULL
				DO NOTHING
			`, feeID, job.SchoolID, stu.ID, stu.ClassID, job.AcademicYearID,
				invoiceNo, job.Month+" Fee", totalAmount, "INR", job.Month, job.Year,
				now.AddDate(0, 0, 10), "unpaid", 0.0, 0.0,
				now, job.GeneratedBy, now, now)
			if err != nil {
				log.Printf("[fee-repo] gen insert error for student %s: %v", stu.ID, err)
			}
			done++
		}

		if err := tx.Commit(ctx); err != nil {
			_ = tx.Rollback(ctx)
			return fmt.Errorf("commit batch: %w", err)
		}

		if progressFn != nil {
			progressFn(done, total)
		}
	}

	r.invalidate(ctx, job.SchoolID, job.AcademicYearID)
	return nil
}

func (r *FeeRepo) invalidate(ctx context.Context, schoolID, yearID string) {
	if r.cache == nil || !r.cache.Available() {
		return
	}
	_, _ = r.cache.Del(ctx,
		fmt.Sprintf("fees:summary:%s:%s", schoolID, yearID),
		fmt.Sprintf("dash:%s:%s", schoolID, yearID),
		fmt.Sprintf("composite:%s:%s", schoolID, yearID),
	)
}

func monthNum(m string) int {
	months := map[string]int{
		"january": 1, "february": 2, "march": 3, "april": 4,
		"may": 5, "june": 6, "july": 7, "august": 8,
		"september": 9, "october": 10, "november": 11, "december": 12,
	}
	if n, ok := months[strings.ToLower(m)]; ok {
		return n
	}
	return 1
}
