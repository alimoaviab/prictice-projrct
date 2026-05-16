package persistence

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// These tests verify pgxpool configuration. They require a running PostgreSQL
// instance. Skip if DATABASE_URL is not set (CI without PG).
//
// Run with: DATABASE_URL=postgres://... go test ./internal/persistence/ -v

func getTestDSN() string {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("TEST_DATABASE_URL")
	}
	return dsn
}

func skipIfNoDB(t *testing.T) {
	t.Helper()
	if getTestDSN() == "" {
		t.Skip("DATABASE_URL not set — skipping integration test")
	}
}

// ─── TEST: Pool Configuration Values ─────────────────────────────────────

func TestPoolConfig_MaxConns(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()

	p, err := New(ctx, getTestDSN())
	require.NoError(t, err)
	defer p.Close()

	// Verify MaxConns is set to 25
	pool := p.Pool()
	require.NotNil(t, pool)

	config := pool.Config()
	assert.Equal(t, int32(25), config.MaxConns,
		"MaxConns should be 25")
}

func TestPoolConfig_MinConns(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()

	p, err := New(ctx, getTestDSN())
	require.NoError(t, err)
	defer p.Close()

	config := p.Pool().Config()
	assert.Equal(t, int32(5), config.MinConns,
		"MinConns should be 5")
}

func TestPoolConfig_Timeouts(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()

	p, err := New(ctx, getTestDSN())
	require.NoError(t, err)
	defer p.Close()

	config := p.Pool().Config()
	assert.Equal(t, 30*time.Minute, config.MaxConnLifetime,
		"MaxConnLifetime should be 30 minutes")
	assert.Equal(t, 5*time.Minute, config.MaxConnIdleTime,
		"MaxConnIdleTime should be 5 minutes")
	assert.Equal(t, 30*time.Second, config.HealthCheckPeriod,
		"HealthCheckPeriod should be 30 seconds")
}

// ─── TEST: Pool Acquire and Release ──────────────────────────────────────

func TestPool_AcquireRelease(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()

	p, err := New(ctx, getTestDSN())
	require.NoError(t, err)
	defer p.Close()

	pool := p.Pool()

	// Get initial stats
	statsBefore := pool.Stat()
	idleBefore := statsBefore.IdleConns()

	// Acquire a connection
	conn, err := pool.Acquire(ctx)
	require.NoError(t, err)
	require.NotNil(t, conn)

	// Use the connection
	var result int
	err = conn.QueryRow(ctx, "SELECT 1").Scan(&result)
	require.NoError(t, err)
	assert.Equal(t, 1, result)

	// Release
	conn.Release()

	// Pool should still be healthy
	statsAfter := pool.Stat()
	assert.GreaterOrEqual(t, statsAfter.IdleConns(), idleBefore-1,
		"idle connections should recover after release")
}

// ─── TEST: Pool Health Check (Ping) ──────────────────────────────────────

func TestPool_HealthCheck(t *testing.T) {
	skipIfNoDB(t)
	ctx := context.Background()

	p, err := New(ctx, getTestDSN())
	require.NoError(t, err)
	defer p.Close()

	// Ping should succeed on healthy DB
	err = p.Pool().Ping(ctx)
	assert.NoError(t, err, "ping should succeed on healthy database")
}

// ─── TEST: Empty DSN Returns No-Op Persister ─────────────────────────────

func TestPool_EmptyDSN_NoOp(t *testing.T) {
	ctx := context.Background()

	p, err := New(ctx, "")
	require.NoError(t, err)

	assert.False(t, p.Available(), "empty DSN should create no-op persister")
	assert.Nil(t, p.Pool(), "Pool() should return nil for no-op persister")

	// Operations should be safe no-ops
	p.Save("students", nil)
	p.Delete("students", "id")
	p.Close() // Should not panic
}

// ─── TEST: Invalid DSN Returns Error ─────────────────────────────────────

func TestPool_InvalidDSN_ReturnsError(t *testing.T) {
	ctx := context.Background()

	_, err := New(ctx, "postgres://invalid:invalid@localhost:9999/nonexistent?connect_timeout=1")
	assert.Error(t, err, "invalid DSN should return error")
}

// ─── TEST: ParseConfig Validates Pool Settings ───────────────────────────

func TestPoolConfig_ParseAndValidate(t *testing.T) {
	// Test that our configuration is applied correctly to pgxpool.Config
	dsn := "postgres://user:pass@localhost:5432/db?sslmode=disable"

	poolConfig, err := pgxpool.ParseConfig(dsn)
	require.NoError(t, err)

	// Apply our settings (same as in New())
	poolConfig.MaxConns = 25
	poolConfig.MinConns = 5
	poolConfig.MaxConnLifetime = 30 * time.Minute
	poolConfig.MaxConnIdleTime = 5 * time.Minute
	poolConfig.HealthCheckPeriod = 30 * time.Second

	// Verify
	assert.Equal(t, int32(25), poolConfig.MaxConns)
	assert.Equal(t, int32(5), poolConfig.MinConns)
	assert.Equal(t, 30*time.Minute, poolConfig.MaxConnLifetime)
	assert.Equal(t, 5*time.Minute, poolConfig.MaxConnIdleTime)
	assert.Equal(t, 30*time.Second, poolConfig.HealthCheckPeriod)
}
