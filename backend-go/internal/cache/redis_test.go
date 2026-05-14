package cache

import (
	"context"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newTestClient creates a Client backed by miniredis (in-memory, no real Redis needed).
func newTestClient(t *testing.T) (*Client, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr()})
	return &Client{rdb: rdb}, mr
}

// newNilClient creates a Client with no Redis connection (no-op mode).
func newNilClient() *Client {
	return &Client{rdb: nil}
}

// ─── TEST 1: Redis Get ───────────────────────────────────────────────────

func TestRedisGet_Hit(t *testing.T) {
	c, mr := newTestClient(t)
	ctx := context.Background()

	// Setup: store a value directly in miniredis
	mr.Set("test:key", "hello world")

	// Act
	val, err := c.Get(ctx, "test:key")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, []byte("hello world"), val)
}

func TestRedisGet_Miss(t *testing.T) {
	c, _ := newTestClient(t)
	ctx := context.Background()

	// Act: key does not exist
	val, err := c.Get(ctx, "nonexistent:key")

	// Assert: nil value, nil error (miss is NOT an error)
	assert.NoError(t, err)
	assert.Nil(t, val)
}

func TestRedisGet_ConnectionDown(t *testing.T) {
	c, mr := newTestClient(t)
	ctx := context.Background()

	// Simulate Redis going offline
	mr.Close()

	// Act: should NOT panic, should return gracefully
	val, err := c.Get(ctx, "any:key")

	// Assert: returns nil with an error (but no panic)
	assert.Nil(t, val)
	// Error is expected when connection is down
	assert.Error(t, err)
}

func TestRedisGet_NilClient_GracefulDegradation(t *testing.T) {
	c := newNilClient()
	ctx := context.Background()

	// Act: nil client should not crash
	val, err := c.Get(ctx, "any:key")

	// Assert: returns nil, nil (treated as cache miss)
	assert.NoError(t, err)
	assert.Nil(t, val)
}

// ─── TEST 2: Redis Set ───────────────────────────────────────────────────

func TestRedisSet_Success(t *testing.T) {
	c, mr := newTestClient(t)
	ctx := context.Background()

	// Act
	err := c.Set(ctx, "test:set", []byte(`{"status":"ok"}`), 5*time.Minute)

	// Assert
	require.NoError(t, err)

	// Verify value stored correctly
	val, err := mr.Get("test:set")
	require.NoError(t, err)
	assert.Equal(t, `{"status":"ok"}`, val)

	// Verify TTL was set (miniredis tracks TTL)
	ttl := mr.TTL("test:set")
	assert.True(t, ttl > 0, "TTL should be set")
	assert.True(t, ttl <= 5*time.Minute, "TTL should be <= 5 minutes")
}

func TestRedisSet_NilClient_NoOp(t *testing.T) {
	c := newNilClient()
	ctx := context.Background()

	// Act: should not crash on nil client
	err := c.Set(ctx, "key", []byte("value"), time.Minute)

	// Assert: no error (silent no-op)
	assert.NoError(t, err)
}

// ─── TEST 3: Redis Del ───────────────────────────────────────────────────

func TestRedisDel_MultipleKeys(t *testing.T) {
	c, mr := newTestClient(t)
	ctx := context.Background()

	// Setup: create multiple keys
	mr.Set("key:1", "a")
	mr.Set("key:2", "b")
	mr.Set("key:3", "c")

	// Act: delete two of them
	deleted, err := c.Del(ctx, "key:1", "key:2")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, int64(2), deleted)

	// Verify key:3 still exists
	assert.True(t, mr.Exists("key:3"))
	assert.False(t, mr.Exists("key:1"))
	assert.False(t, mr.Exists("key:2"))
}

func TestRedisDel_NonexistentKeys(t *testing.T) {
	c, _ := newTestClient(t)
	ctx := context.Background()

	// Act: delete keys that don't exist
	deleted, err := c.Del(ctx, "ghost:1", "ghost:2")

	// Assert: no error, 0 deleted
	require.NoError(t, err)
	assert.Equal(t, int64(0), deleted)
}

func TestRedisDel_EmptyKeys(t *testing.T) {
	c, _ := newTestClient(t)
	ctx := context.Background()

	// Act: empty key list
	deleted, err := c.Del(ctx)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, int64(0), deleted)
}

// ─── TEST 4: Redis Exists ────────────────────────────────────────────────

func TestRedisExists_KeyPresent(t *testing.T) {
	c, mr := newTestClient(t)
	ctx := context.Background()

	mr.Set("exists:key", "yes")

	exists, err := c.Exists(ctx, "exists:key")
	require.NoError(t, err)
	assert.True(t, exists)
}

func TestRedisExists_KeyAbsent(t *testing.T) {
	c, _ := newTestClient(t)
	ctx := context.Background()

	exists, err := c.Exists(ctx, "missing:key")
	require.NoError(t, err)
	assert.False(t, exists)
}

// ─── TEST 5: Graceful Degradation ────────────────────────────────────────

func TestRedis_GracefulDegradation_AllMethods(t *testing.T) {
	// Test that ALL methods work without crashing when client is nil
	c := newNilClient()
	ctx := context.Background()

	t.Run("Get", func(t *testing.T) {
		val, err := c.Get(ctx, "key")
		assert.NoError(t, err)
		assert.Nil(t, val)
	})

	t.Run("Set", func(t *testing.T) {
		err := c.Set(ctx, "key", []byte("val"), time.Minute)
		assert.NoError(t, err)
	})

	t.Run("Del", func(t *testing.T) {
		n, err := c.Del(ctx, "key")
		assert.NoError(t, err)
		assert.Equal(t, int64(0), n)
	})

	t.Run("Exists", func(t *testing.T) {
		exists, err := c.Exists(ctx, "key")
		assert.NoError(t, err)
		assert.False(t, exists)
	})

	t.Run("Available", func(t *testing.T) {
		assert.False(t, c.Available())
	})

	t.Run("Close", func(t *testing.T) {
		err := c.Close()
		assert.NoError(t, err)
	})
}
