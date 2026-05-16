// Package middleware — tenant_rls.go sets the PostgreSQL session variable
// for Row-Level Security on every request.
//
// When RLS is enabled, every query is filtered by:
//   WHERE school_id = current_setting('app.current_school_id')
//
// This middleware extracts the school_id from the JWT claims (already parsed
// by the auth middleware) and stores it in the request context. Domain
// handlers that use direct PG queries should call SetTenantContext() before
// executing queries.
//
// Usage pattern for direct PG queries:
//
//	conn, err := pool.Acquire(ctx)
//	if err != nil { ... }
//	defer conn.Release()
//
//	if err := middleware.SetTenantContext(ctx, conn, schoolID); err != nil { ... }
//
//	rows, err := conn.Query(ctx, "SELECT * FROM students WHERE ...")
//	// RLS automatically filters to only this school's rows
package middleware

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// SetTenantContext sets the PostgreSQL session variable for RLS.
// Must be called on a connection BEFORE executing any queries.
//
// Uses SET LOCAL which is scoped to the current transaction. If you're not
// in a transaction, use SET (session-level) instead — but be careful to
// release the connection back to the pool afterward.
func SetTenantContext(ctx context.Context, conn *pgxpool.Conn, schoolID string) error {
	_, err := conn.Exec(ctx, "SET LOCAL app.current_school_id = $1", schoolID)
	if err != nil {
		return fmt.Errorf("set tenant context: %w", err)
	}
	return nil
}

// SetTenantContextTx sets the RLS context within an existing transaction.
func SetTenantContextTx(ctx context.Context, tx pgx.Tx, schoolID string) error {
	_, err := tx.Exec(ctx, "SET LOCAL app.current_school_id = $1", schoolID)
	if err != nil {
		return fmt.Errorf("set tenant context in tx: %w", err)
	}
	return nil
}

// WithTenant acquires a connection from the pool, sets the tenant context,
// and calls the provided function. The connection is automatically released
// when the function returns.
//
// Usage:
//
//	err := middleware.WithTenant(ctx, pool, schoolID, func(conn *pgxpool.Conn) error {
//	    rows, err := conn.Query(ctx, "SELECT * FROM students")
//	    // ... RLS ensures only this school's students are returned
//	    return err
//	})
func WithTenant(ctx context.Context, pool *pgxpool.Pool, schoolID string, fn func(*pgxpool.Conn) error) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire connection: %w", err)
	}
	defer conn.Release()

	// Begin a transaction so SET LOCAL is scoped properly
	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	// Set the tenant context
	if _, err := tx.Exec(ctx, "SET LOCAL app.current_school_id = $1", schoolID); err != nil {
		return fmt.Errorf("set tenant: %w", err)
	}

	// Execute the user's function with the tenant-scoped connection
	if err := fn(conn); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// WithTenantTx is like WithTenant but provides a transaction directly.
// The caller gets a pgx.Tx with the tenant context already set.
//
// Usage:
//
//	err := middleware.WithTenantTx(ctx, pool, schoolID, func(tx pgx.Tx) error {
//	    _, err := tx.Exec(ctx, "INSERT INTO students ...")
//	    return err
//	})
func WithTenantTx(ctx context.Context, pool *pgxpool.Pool, schoolID string, fn func(pgx.Tx) error) error {
	conn, err := pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire connection: %w", err)
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, "SET LOCAL app.current_school_id = $1", schoolID); err != nil {
		return fmt.Errorf("set tenant: %w", err)
	}

	if err := fn(tx); err != nil {
		return err
	}

	return tx.Commit(ctx)
}
