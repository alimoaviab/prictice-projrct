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

// New connects to the configured database. When `dsn` is empty, the
// returned Persister is a no-op so the server can fall back to pure
// in-memory mode (development convenience).
func New(ctx context.Context, dsn string) (*Persister, error) {
	if strings.TrimSpace(dsn) == "" {
		log.Println("[persistence] DATABASE_URL is empty — running in pure in-memory mode (no durability).")
		return &Persister{}, nil
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool.New: %w", err)
	}
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(pingCtx); err != nil {
		return nil, fmt.Errorf("postgres ping: %w", err)
	}
	log.Println("[persistence] connected to PostgreSQL")
	return &Persister{pool: pool, flushInterval: 1 * time.Second}, nil
}

// Available reports whether a PostgreSQL pool is configured.
func (p *Persister) Available() bool { return p != nil && p.pool != nil }

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

func (p *Persister) drainQueue() []write {
	p.mu.Lock()
	defer p.mu.Unlock()
	out := p.queue
	p.queue = nil
	return out
}

// flush commits the queued writes inside a single transaction.
func (p *Persister) flush(ctx context.Context) error {
	if p == nil || p.pool == nil {
		return nil
	}
	writes := p.drainQueue()
	if len(writes) == 0 {
		return nil
	}
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()

	for _, w := range writes {
		if w.delete {
			if err := deleteRow(ctx, tx, w.table, w.id); err != nil {
				return fmt.Errorf("delete %s/%s: %w", w.table, w.id, err)
			}
			continue
		}
		if err := upsertRow(ctx, tx, w.table, w.doc); err != nil {
			// Log the failing document for debugging
			docJSON, _ := json.Marshal(w.doc)
			log.Printf("[persistence] upsert %s failed: %v | data: %s", w.table, err, string(docJSON))
			return fmt.Errorf("upsert %s: %w", w.table, err)
		}
	}
	return tx.Commit(ctx)
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
	s.RUnlock()

	if len(plan) == 0 {
		return nil
	}
	tx, err := p.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	for _, w := range plan {
		if err := upsertRow(ctx, tx, w.table, w.doc); err != nil {
			// Log the failing document for debugging
			docJSON, _ := json.Marshal(w.doc)
			log.Printf("[persistence] snapshot upsert %s failed: %v | data: %s", w.table, err, string(docJSON))
			return fmt.Errorf("upsert %s: %w", w.table, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return err
	}
	log.Printf("[persistence] full snapshot successful (%d entities)", len(plan))
	return nil
}
