// Package cache provides a Redis client wrapper for the Eduplexo backend.
//
// Design principles:
//   - Graceful degradation: if Redis is down, operations return errors but
//     NEVER crash the application. Callers should treat cache misses as
//     normal and fall through to the database.
//   - Simple interface: Get/Set/Del/Exists cover 95% of caching needs.
//   - Context-aware: all operations accept context for timeout/cancellation.
//   - Observable: all errors are logged for monitoring.
//
// Usage:
//
//	rdb := cache.New("redis://redis:6379/0")
//	defer rdb.Close()
//
//	// Set with TTL
//	rdb.Set(ctx, "dash:school_1:2025", dashboardJSON, 5*time.Minute)
//
//	// Get (returns nil, nil on miss — not an error)
//	val, err := rdb.Get(ctx, "dash:school_1:2025")
//
//	// Delete (invalidation)
//	rdb.Del(ctx, "dash:school_1:2025", "students:school_1:*")
package cache

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps a go-redis client with graceful error handling.
// When Redis is unavailable, all methods return errors without panicking,
// allowing the application to fall through to the database.
type Client struct {
	rdb *redis.Client
}

// New creates a Redis client from the given URL (e.g. "redis://redis:6379/0").
// If the URL is empty, returns a no-op client where all operations silently
// return cache-miss behavior (nil values, no errors on writes).
//
// The connection is NOT validated here — it will be checked lazily on first
// use. This prevents Redis being a hard boot dependency.
func New(redisURL string) *Client {
	if redisURL == "" {
		log.Println("[cache] REDIS_URL is empty — running without cache layer.")
		return &Client{rdb: nil}
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[cache] WARNING: invalid REDIS_URL (%v) — running without cache.", err)
		return &Client{rdb: nil}
	}

	// Connection pool settings optimized for a multi-tenant ERP.
	opts.PoolSize = 20    // Max connections in pool
	opts.MinIdleConns = 5 // Keep warm connections
	opts.MaxRetries = 2   // Retry transient failures
	opts.DialTimeout = 3 * time.Second
	opts.ReadTimeout = 2 * time.Second
	opts.WriteTimeout = 2 * time.Second
	opts.PoolTimeout = 3 * time.Second

	client := redis.NewClient(opts)

	// Attempt a ping to verify connectivity (non-fatal).
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[cache] WARNING: Redis ping failed (%v) — cache will retry on next operation.", err)
	} else {
		log.Println("[cache] connected to Redis")
	}

	return &Client{rdb: client}
}

// Available reports whether a Redis client is configured and was initialized.
func (c *Client) Available() bool {
	return c != nil && c.rdb != nil
}

// Close releases the Redis connection pool. Safe to call on nil client.
func (c *Client) Close() error {
	if c == nil || c.rdb == nil {
		return nil
	}
	return c.rdb.Close()
}

// Ping checks Redis connectivity. Returns error if unavailable.
func (c *Client) Ping(ctx context.Context) error {
	if !c.Available() {
		return ErrNotAvailable
	}
	return c.rdb.Ping(ctx).Err()
}

// ─── Core Operations ─────────────────────────────────────────────────────

// Get retrieves a value by key. Returns:
//   - (value, nil) on cache hit
//   - (nil, nil) on cache miss (key doesn't exist)
//   - (nil, error) on Redis failure
//
// Callers should treat (nil, nil) as "not cached, query the database".
func (c *Client) Get(ctx context.Context, key string) ([]byte, error) {
	if !c.Available() {
		return nil, nil // No-op: treat as cache miss
	}

	val, err := c.rdb.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil // Cache miss — not an error
	}
	if err != nil {
		log.Printf("[cache] GET %s failed: %v", key, err)
		return nil, err
	}
	return val, nil
}

// GetString is a convenience wrapper that returns the cached value as a string.
func (c *Client) GetString(ctx context.Context, key string) (string, bool, error) {
	val, err := c.Get(ctx, key)
	if err != nil {
		return "", false, err
	}
	if val == nil {
		return "", false, nil // miss
	}
	return string(val), true, nil
}

// Set stores a value with the given TTL. If ttl is 0, the key never expires
// (use with caution — prefer explicit TTLs).
//
// Errors are logged but NOT returned as fatal — a failed cache write should
// never break the request flow.
func (c *Client) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	if !c.Available() {
		return nil // No-op
	}

	err := c.rdb.Set(ctx, key, value, ttl).Err()
	if err != nil {
		log.Printf("[cache] SET %s failed: %v", key, err)
		return err
	}
	return nil
}

// SetString is a convenience wrapper for string values.
func (c *Client) SetString(ctx context.Context, key, value string, ttl time.Duration) error {
	return c.Set(ctx, key, []byte(value), ttl)
}

// SetJSON is a convenience wrapper — caller should pre-marshal to []byte.
// This is intentionally NOT doing json.Marshal internally to keep the
// package dependency-free and let callers control serialization.
func (c *Client) SetJSON(ctx context.Context, key string, jsonBytes []byte, ttl time.Duration) error {
	return c.Set(ctx, key, jsonBytes, ttl)
}

// Del removes one or more keys. Used for cache invalidation.
// Returns the number of keys that were deleted.
//
// Errors are logged but not fatal.
func (c *Client) Del(ctx context.Context, keys ...string) (int64, error) {
	if !c.Available() {
		return 0, nil
	}
	if len(keys) == 0 {
		return 0, nil
	}

	deleted, err := c.rdb.Del(ctx, keys...).Result()
	if err != nil {
		log.Printf("[cache] DEL %v failed: %v", keys, err)
		return 0, err
	}
	return deleted, nil
}

// Exists checks if a key exists in Redis. Returns true if the key exists.
// On error, returns false (treat as cache miss).
func (c *Client) Exists(ctx context.Context, key string) (bool, error) {
	if !c.Available() {
		return false, nil
	}

	n, err := c.rdb.Exists(ctx, key).Result()
	if err != nil {
		log.Printf("[cache] EXISTS %s failed: %v", key, err)
		return false, err
	}
	return n > 0, nil
}

// ─── Utility Operations ──────────────────────────────────────────────────

// Expire updates the TTL on an existing key. Useful for "touch" patterns
// where you want to extend cache lifetime on access.
func (c *Client) Expire(ctx context.Context, key string, ttl time.Duration) error {
	if !c.Available() {
		return nil
	}
	return c.rdb.Expire(ctx, key, ttl).Err()
}

// Incr atomically increments a key (useful for rate limiting counters).
// Creates the key with value 1 if it doesn't exist.
func (c *Client) Incr(ctx context.Context, key string) (int64, error) {
	if !c.Available() {
		return 0, nil
	}
	return c.rdb.Incr(ctx, key).Result()
}

// DelPattern deletes all keys matching a glob pattern (e.g. "students:school_1:*").
// Uses SCAN internally to avoid blocking Redis with KEYS command.
//
// WARNING: Use sparingly — pattern deletion is O(n) on the keyspace.
func (c *Client) DelPattern(ctx context.Context, pattern string) (int64, error) {
	if !c.Available() {
		return 0, nil
	}

	var cursor uint64
	var totalDeleted int64

	for {
		keys, nextCursor, err := c.rdb.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			log.Printf("[cache] SCAN %s failed: %v", pattern, err)
			return totalDeleted, err
		}

		if len(keys) > 0 {
			deleted, err := c.rdb.Del(ctx, keys...).Result()
			if err != nil {
				log.Printf("[cache] DEL (pattern) failed: %v", err)
			}
			totalDeleted += deleted
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	return totalDeleted, nil
}

// ─── Errors ──────────────────────────────────────────────────────────────

// ErrNotAvailable is returned when Redis is not configured.
var ErrNotAvailable = &CacheError{Message: "redis not available"}

// CacheError represents a non-fatal cache error.
type CacheError struct {
	Message string
}

func (e *CacheError) Error() string {
	return "[cache] " + e.Message
}

// ─── Raw Client Access ───────────────────────────────────────────────────

// Raw returns the underlying go-redis client for advanced operations
// (pub/sub, transactions, etc). Returns nil if Redis is not configured.
func (c *Client) Raw() *redis.Client {
	if c == nil {
		return nil
	}
	return c.rdb
}
