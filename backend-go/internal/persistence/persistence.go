// Package persistence wires the in-memory MemStore to PostgreSQL.
//
// The schema (migrations/000001_init.up.sql) is fully relational: every
// entity has its own table with proper FKs, CHECK constraints, and unique
// indexes — no JSONB-blob fallback. This package handles three things:
//
//   1. Load: on boot, hydrate the MemStore from PostgreSQL so every domain
//      handler reads from a warm cache.
//   2. Save: on every mutation, the active handler appends to the queue;
//      a background goroutine commits batched UPSERTs in a single
//      transaction.
//   3. FullSnapshot: periodic write-through of the entire MemStore as a
//      safety net. Idempotent — relies on UPSERT semantics.
//
// The map of "collection name → SQL table + UPSERT statement" lives in
// upsert.go. There is one statement per entity, hand-written to match the
// CREATE TABLE column list exactly.
package persistence

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/eduplexo/backend-go/internal/store"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Persister owns the connection pool, write queue, and snapshot loop.
type Persister struct {
	pool *pgxpool.Pool

	mu            sync.Mutex
	queue         []write
	flushInterval time.Duration
}

type write struct {
	table  string
	doc    any
	delete bool
	id     string
}

// extractSchoolID attempts to extract a SchoolID from known store types.
func extractSchoolID(doc any) string {
	if doc == nil {
		return ""
	}
	switch v := doc.(type) {
	case *store.School:
		return v.SchoolID
	case *store.User:
		return v.SchoolID
	case *store.AcademicYear:
		return v.SchoolID
	case *store.Subject:
		return v.SchoolID
	case *store.Class:
		return v.SchoolID
	case *store.Teacher:
		return v.SchoolID
	case *store.Student:
		return v.SchoolID
	case *store.Parent:
		return v.SchoolID
	case *store.StudentParent:
		return v.SchoolID
	case *store.Attendance:
		return v.SchoolID
	case *store.Exam:
		return v.SchoolID
	case *store.Result:
		return v.SchoolID
	case *store.Homework:
		return v.SchoolID
	case *store.Announcement:
		return v.SchoolID
	case *store.Behavior:
		return v.SchoolID
	case *store.Event:
		return v.SchoolID
	case *store.Leave:
		return v.SchoolID
	case *store.Timetable:
		return v.SchoolID
	case *store.LiveClass:
		return v.SchoolID
	case *store.Notification:
		return v.SchoolID
	case *store.FeeType:
		return v.SchoolID
	case *store.ClassFee:
		return v.SchoolID
	case *store.Fee:
		return v.SchoolID
	case *store.FeeAdjustment:
		return v.SchoolID
	case *store.FeePayment:
		return v.SchoolID
	case *store.SchoolSettings:
		return v.SchoolID
	case *store.AuditLog:
		return v.SchoolID
	case *store.CertificateTemplate:
		return v.SchoolID
	case *store.GeneratedCertificate:
		return v.SchoolID
	case *store.Chapter:
		return v.SchoolID
	case *store.Question:
		return v.SchoolID
	case *store.QuestionPaper:
		return v.SchoolID
	case *store.StarCollection:
		return v.SchoolID
	default:
		return ""
	}
}

// New connects to the configured database. When `dsn` is empty, the
// returned Persister is a no-op so the server can fall back to pure
// in-memory mode (development convenience).
//
// Pool configuration:
//   - MaxConns: 25 — sufficient for a 4-core VPS with SSD
//   - MinConns: 5  — keep warm connections to avoid cold-start latency
//   - MaxConnLifetime: 30 min — recycle connections to pick up PG config changes
//   - MaxConnIdleTime: 5 min — release idle connections back to the OS
//   - HealthCheckPeriod: 30s — detect broken connections before they're used
func New(ctx context.Context, dsn string) (*Persister, error) {
	if strings.TrimSpace(dsn) == "" {
		log.Println("[persistence] DATABASE_URL is empty — running in pure in-memory mode (no durability).")
		return &Persister{}, nil
	}

	poolConfig, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.ParseConfig: %w", err)
	}

	// Connection pool tuning for production workloads.
	// Formula: MaxConns = (CPU cores × 2) + effective_spindle_count
	// For 4-core VPS with SSD: (4×2)+1 = 9 minimum, 25 comfortable max.
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute
	poolConfig.HealthCheckPeriod = 30 * time.Second

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.NewWithConfig: %w", err)
	}

	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		return nil, fmt.Errorf("postgres ping: %w", err)
	}

	log.Printf("[persistence] connected to PostgreSQL (pool: max=%d, min=%d, lifetime=%s)",
		poolConfig.MaxConns, poolConfig.MinConns, poolConfig.MaxConnLifetime)
	return &Persister{pool: pool, flushInterval: 1 * time.Second}, nil
}

// Available reports whether a PostgreSQL pool is configured.
func (p *Persister) Available() bool { return p != nil && p.pool != nil }

// Pool returns the underlying pgxpool.Pool for direct queries.
// Returns nil if PostgreSQL is not configured. Domain handlers that need
// direct PG access (bypassing MemStore) should check Available() first.
func (p *Persister) Pool() *pgxpool.Pool {
	if p == nil {
		return nil
	}
	return p.pool
}

// Close releases the pool. Safe on nil.
func (p *Persister) Close() {
	if p != nil && p.pool != nil {
		p.pool.Close()
	}
}

// Save schedules a write-through for one document. Non-blocking; the
// background flush goroutine batches writes for efficiency. The `table`
// argument names the SQL target (see upsert.go for the registry).
//
// In no-op mode (no PG configured) this is a silent no-op, so domain
// handlers can call it unconditionally.
func (p *Persister) Save(table string, doc any) {
	if p == nil || p.pool == nil {
		return
	}
	p.mu.Lock()
	p.queue = append(p.queue, write{table: table, doc: doc})
	p.mu.Unlock()
}

// Delete schedules a row removal by primary key.
func (p *Persister) Delete(table, id string) {
	if p == nil || p.pool == nil {
		return
	}
	p.mu.Lock()
	p.queue = append(p.queue, write{table: table, id: id, delete: true})
	p.mu.Unlock()
}

// DeleteWithDoc schedules a delete using the provided document so the
// persistence layer can extract the tenant (`SchoolID`) for RLS.
func (p *Persister) DeleteWithDoc(table string, doc any) {
	if p == nil || p.pool == nil {
		return
	}
	p.mu.Lock()
	p.queue = append(p.queue, write{table: table, doc: doc, delete: true})
	p.mu.Unlock()
}

func (p *Persister) drainQueue() []write {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := p.queue
	p.queue = nil
	return out
}

// tableOrder defines the FK-safe insertion order. Parent tables first,
// child tables after. This prevents FK violations during flush.
var tableOrder = []string{
	"schools", "packages", "users", "academic_years", "subjects",
	"teachers", "classes",
	"students", "parents", "student_parents",
	"attendance", "exams", "results", "homework", "announcements",
	"behaviors", "events", "leaves", "timetables", "live_classes",
	"notifications", "fee_types", "class_fees", "fees",
	"fee_adjustments", "fee_payments", "school_settings", "audit_logs",
	"certificate_templates", "generated_certificates",
	"chapters", "questions", "question_papers", "star_collections",
	"student_scholarships", "student_fee_discounts", "student_wallets", "wallet_transactions",
	"conversations", "conversation_participants", "chat_messages", "broadcasts",
	"schedules", "schedule_reminders",
}

func tableOrderIndex(table string) int {
	for i, t := range tableOrder {
		if t == table {
			return i
		}
	}
	return len(tableOrder) // Unknown tables go last
}

// flush commits the queued writes inside a single transaction.
// Writes are sorted by FK dependency order to prevent constraint violations.
func (p *Persister) flush(ctx context.Context) error {
	if p == nil || p.pool == nil {
		return nil
	}
	writes := p.drainQueue()
	if len(writes) == 0 {
		return nil
	}

	// Sort writes by FK dependency order (parents before children)
	sort.SliceStable(writes, func(i, j int) bool {
		oi := tableOrderIndex(writes[i].table)
		oj := tableOrderIndex(writes[j].table)
		if oi != oj {
			return oi < oj
		}
		// Deletes after inserts within same table
		return !writes[i].delete && writes[j].delete
	})

	// Process each write in its own savepoint so one failure doesn't kill the batch
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var succeeded, failed int
	for _, w := range writes {
		// Set tenant context (best-effort)
		if sid := extractSchoolID(w.doc); sid != "" {
			_, _ = tx.Exec(ctx, "SELECT set_config('app.current_school_id', $1, true)", sid)
		}

		// Use savepoint so individual failures don't abort the transaction
		_, _ = tx.Exec(ctx, "SAVEPOINT sp")

		var writeErr error
		if w.delete {
			writeErr = deleteRow(ctx, tx, w.table, w.id)
		} else {
			writeErr = upsertRow(ctx, tx, w.table, w.doc)
		}

		if writeErr != nil {
			// Rollback to savepoint (keeps transaction alive for other writes)
			_, _ = tx.Exec(ctx, "ROLLBACK TO SAVEPOINT sp")
			failed++

			// Only re-queue if it's a FK error (ordering issue, will succeed in snapshot).
			// Don't re-queue unique constraint violations or other permanent errors.
			if isFKError(writeErr) {
				p.mu.Lock()
				p.queue = append(p.queue, w)
				p.mu.Unlock()
			}

			// Only log non-FK errors (FK errors are expected and handled by snapshot order)
			if !isFKError(writeErr) {
				docJSON, _ := json.Marshal(w.doc)
				log.Printf("[persistence] upsert %s failed: %v | data: %.200s", w.table, writeErr, string(docJSON))
			}
		} else {
			_, _ = tx.Exec(ctx, "RELEASE SAVEPOINT sp")
			succeeded++
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("flush commit: %w", err)
	}

	if failed > 0 {
		log.Printf("[persistence] flush: %d succeeded, %d failed (will retry in snapshot)", succeeded, failed)
	}
	return nil
}

// isFKError checks if an error is a foreign key constraint violation.
func isFKError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "23503") || strings.Contains(s, "foreign key constraint")
}

// isUniqueError checks if an error is a unique constraint violation.
func isUniqueError(err error) bool {
	if err == nil {
		return false
	}
	s := err.Error()
	return strings.Contains(s, "23505") || strings.Contains(s, "duplicate key")
}

// StartBackground launches the flush + heartbeat goroutine. Cancel the
// context to stop. Safe to call on a no-op Persister; it just returns.
//
// The goroutine performs two concurrent jobs on the same ticker schedule:
//   - flush: drain the explicit Save/Delete queue every `flushInterval`.
//   - snapshot: every 30 s, push the entire MemStore back to PostgreSQL as
//     a belt-and-suspenders backup (an UPSERT-only safety net for any
//     handler that mutated state without calling Save).
//
// The two jobs share the same goroutine so they cannot interleave with
// each other inside the same transaction context.
func (p *Persister) StartBackground(ctx context.Context, snapshotEvery time.Duration, snapshotter func(context.Context) error) {
	if p == nil || p.pool == nil {
		return
	}
	interval := p.flushInterval
	if interval == 0 {
		interval = 2 * time.Second
	}
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()
		var nextSnapshot time.Time
		if snapshotEvery > 0 {
			nextSnapshot = time.Now().Add(snapshotEvery)
		}
		for {
			select {
			case <-ctx.Done():
				flushCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
				if err := p.flush(flushCtx); err != nil {
					log.Printf("[persistence] final flush failed: %v", err)
				}
				cancel()
				return
			case <-ticker.C:
				if err := p.flush(ctx); err != nil {
					log.Printf("[persistence] flush error: %v", err)
				}
				if snapshotter != nil && snapshotEvery > 0 && time.Now().After(nextSnapshot) {
					if err := snapshotter(ctx); err != nil {
						log.Printf("[persistence] snapshot error: %v", err)
					}
					nextSnapshot = time.Now().Add(snapshotEvery)
				}
			}
		}
	}()
}

// FullSnapshot writes every document in the MemStore back to PostgreSQL.
// Idempotent. Used as a safety net (every minute) and on graceful shutdown.
func (p *Persister) FullSnapshot(ctx context.Context, s *store.MemStore) error {
	if p == nil || p.pool == nil {
		return nil
	}

	s.RLock()
	plan := make([]write, 0, 1024)
	for _, v := range s.Schools {
		plan = append(plan, write{table: "schools", doc: v})
	}
	for _, v := range s.Packages {
		plan = append(plan, write{table: "packages", doc: v})
	}
	for _, v := range s.Users {
		plan = append(plan, write{table: "users", doc: v})
	}
	for _, v := range s.AcademicYears {
		plan = append(plan, write{table: "academic_years", doc: v})
	}
	for _, v := range s.Subjects {
		plan = append(plan, write{table: "subjects", doc: v})
	}
	// classes need teachers to exist first because of class_teacher_id FK.
	for _, v := range s.Teachers {
		plan = append(plan, write{table: "teachers", doc: v})
	}
	for _, v := range s.Classes {
		plan = append(plan, write{table: "classes", doc: v})
	}
	for _, v := range s.Students {
		plan = append(plan, write{table: "students", doc: v})
	}
	for _, v := range s.Parents {
		plan = append(plan, write{table: "parents", doc: v})
	}
	for _, v := range s.StudentParents {
		plan = append(plan, write{table: "student_parents", doc: v})
	}
	for _, v := range s.Attendance {
		plan = append(plan, write{table: "attendance", doc: v})
	}
	for _, v := range s.Exams {
		plan = append(plan, write{table: "exams", doc: v})
	}
	for _, v := range s.Results {
		plan = append(plan, write{table: "results", doc: v})
	}
	for _, v := range s.Homework {
		plan = append(plan, write{table: "homework", doc: v})
	}
	for _, v := range s.Announcements {
		plan = append(plan, write{table: "announcements", doc: v})
	}
	for _, v := range s.Behaviors {
		plan = append(plan, write{table: "behaviors", doc: v})
	}
	for _, v := range s.Events {
		plan = append(plan, write{table: "events", doc: v})
	}
	for _, v := range s.Leaves {
		plan = append(plan, write{table: "leaves", doc: v})
	}
	for _, v := range s.Timetables {
		plan = append(plan, write{table: "timetables", doc: v})
	}
	for _, v := range s.LiveClasses {
		plan = append(plan, write{table: "live_classes", doc: v})
	}
	for _, v := range s.Notifications {
		plan = append(plan, write{table: "notifications", doc: v})
	}
	for _, v := range s.Conversations {
		plan = append(plan, write{table: "conversations", doc: v})
	}
	for _, v := range s.ChatMessages {
		plan = append(plan, write{table: "chat_messages", doc: v})
	}
	for _, v := range s.Broadcasts {
		plan = append(plan, write{table: "broadcasts", doc: v})
	}
	for _, v := range s.Schedules {
		plan = append(plan, write{table: "schedules", doc: v})
	}
	for _, v := range s.ScheduleReminders {
		plan = append(plan, write{table: "schedule_reminders", doc: v})
	}
	for _, v := range s.FeeTypes {
		plan = append(plan, write{table: "fee_types", doc: v})
	}
	for _, v := range s.ClassFees {
		plan = append(plan, write{table: "class_fees", doc: v})
	}
	for _, v := range s.Fees {
		plan = append(plan, write{table: "fees", doc: v})
	}
	for _, v := range s.FeeAdjustments {
		plan = append(plan, write{table: "fee_adjustments", doc: v})
	}
	for _, v := range s.FeePayments {
		plan = append(plan, write{table: "fee_payments", doc: v})
	}
	for _, v := range s.SchoolSettings {
		plan = append(plan, write{table: "school_settings", doc: v})
	}
	for _, v := range s.AuditLogs {
		plan = append(plan, write{table: "audit_logs", doc: v})
	}
	for _, v := range s.CertificateTemplates {
		plan = append(plan, write{table: "certificate_templates", doc: v})
	}
	for _, v := range s.GeneratedCertificates {
		plan = append(plan, write{table: "generated_certificates", doc: v})
	}
	for _, v := range s.Chapters {
		plan = append(plan, write{table: "chapters", doc: v})
	}
	for _, v := range s.Questions {
		plan = append(plan, write{table: "questions", doc: v})
	}
	for _, v := range s.QuestionPapers {
		plan = append(plan, write{table: "question_papers", doc: v})
	}
	for _, v := range s.StarCollections {
		plan = append(plan, write{table: "star_collections", doc: v})
	}
	s.RUnlock()

	if len(plan) == 0 {
		return nil
	}
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var succeeded, failed int
	for _, w := range plan {
		// Use savepoint so one failure doesn't abort the entire snapshot
		_, _ = tx.Exec(ctx, "SAVEPOINT snap_sp")

		if err := upsertRow(ctx, tx, w.table, w.doc); err != nil {
			_, _ = tx.Exec(ctx, "ROLLBACK TO SAVEPOINT snap_sp")
			failed++
			// Only log non-trivial errors (skip duplicate key which is expected)
			if !isUniqueError(err) && !isFKError(err) {
				docJSON, _ := json.Marshal(w.doc)
				log.Printf("[persistence] snapshot upsert %s failed: %v | data: %.200s", w.table, err, string(docJSON))
			}
		} else {
			_, _ = tx.Exec(ctx, "RELEASE SAVEPOINT snap_sp")
			succeeded++
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}
	if failed > 0 {
		log.Printf("[persistence] full snapshot: %d succeeded, %d skipped", succeeded, failed)
	} else {
		log.Printf("[persistence] full snapshot successful (%d entities)", succeeded)
	}
	return nil
}
