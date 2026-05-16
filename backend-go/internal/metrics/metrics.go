// Package metrics provides Prometheus instrumentation for the Eduplexo backend.
//
// Exposed metrics:
//   - http_request_duration_seconds (histogram) — request latency by method/path/status
//   - db_query_duration_seconds (histogram) — PG query latency by type/table
//   - redis_cache_hits_total (counter) — cache hits by key pattern
//   - redis_cache_misses_total (counter) — cache misses by key pattern
//   - active_websocket_connections (gauge) — current WebSocket connections
//   - memstore_collection_size (gauge) — MemStore slice sizes (temporary)
//
// Usage:
//   r.Use(metrics.Middleware)
//   r.Handle("/metrics", metrics.Handler())
package metrics

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ─── HTTP Request Metrics ────────────────────────────────────────────────

var HTTPRequestDuration = prometheus.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "http_request_duration_seconds",
		Help:    "HTTP request duration in seconds.",
		Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
	},
	[]string{"method", "path", "status"},
)

var HTTPRequestsTotal = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "http_requests_total",
		Help: "Total number of HTTP requests.",
	},
	[]string{"method", "path", "status"},
)

// ─── Database Metrics ────────────────────────────────────────────────────

var DBQueryDuration = prometheus.NewHistogramVec(
	prometheus.HistogramOpts{
		Name:    "db_query_duration_seconds",
		Help:    "PostgreSQL query duration in seconds.",
		Buckets: []float64{.001, .005, .01, .025, .05, .1, .25, .5, 1},
	},
	[]string{"query_type", "table"},
)

// ─── Redis Cache Metrics ─────────────────────────────────────────────────

var RedisCacheHits = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "redis_cache_hits_total",
		Help: "Total Redis cache hits.",
	},
	[]string{"key_pattern"},
)

var RedisCacheMisses = prometheus.NewCounterVec(
	prometheus.CounterOpts{
		Name: "redis_cache_misses_total",
		Help: "Total Redis cache misses.",
	},
	[]string{"key_pattern"},
)

// ─── WebSocket Metrics ───────────────────────────────────────────────────

var ActiveWebsockets = prometheus.NewGauge(
	prometheus.GaugeOpts{
		Name: "active_websocket_connections",
		Help: "Number of active WebSocket connections.",
	},
)

// ─── MemStore Metrics (temporary — remove after full PG migration) ───────

var MemstoreSize = prometheus.NewGaugeVec(
	prometheus.GaugeOpts{
		Name: "memstore_collection_size",
		Help: "Number of items in each MemStore collection.",
	},
	[]string{"collection"},
)

// ─── Registration ────────────────────────────────────────────────────────

func init() {
	prometheus.MustRegister(
		HTTPRequestDuration,
		HTTPRequestsTotal,
		DBQueryDuration,
		RedisCacheHits,
		RedisCacheMisses,
		ActiveWebsockets,
		MemstoreSize,
	)
}

// Handler returns the Prometheus metrics HTTP handler.
func Handler() http.Handler {
	return promhttp.Handler()
}

// ─── Chi Middleware ──────────────────────────────────────────────────────

// Middleware records HTTP request duration and status for Prometheus.
// Attach to the Chi router: r.Use(metrics.Middleware)
func Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Wrap ResponseWriter to capture status code
		ww := &statusWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(ww, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(ww.status)

		// Normalize path to avoid high-cardinality labels.
		// Use Chi's route pattern if available, otherwise collapse IDs.
		path := normalizePath(r)

		HTTPRequestDuration.WithLabelValues(r.Method, path, status).Observe(duration)
		HTTPRequestsTotal.WithLabelValues(r.Method, path, status).Inc()
	})
}

// statusWriter wraps http.ResponseWriter to capture the status code.
type statusWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func (w *statusWriter) WriteHeader(code int) {
	if !w.wroteHeader {
		w.status = code
		w.wroteHeader = true
	}
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if !w.wroteHeader {
		w.wroteHeader = true
	}
	return w.ResponseWriter.Write(b)
}

// normalizePath returns the Chi route pattern (e.g. "/api/students/{id}")
// to avoid high-cardinality metric labels from path parameters.
func normalizePath(r *http.Request) string {
	rctx := chi.RouteContext(r.Context())
	if rctx != nil && rctx.RoutePattern() != "" {
		return rctx.RoutePattern()
	}
	// Fallback: collapse UUID-like segments
	parts := strings.Split(r.URL.Path, "/")
	for i, p := range parts {
		if len(p) > 8 && !strings.Contains(p, ".") {
			parts[i] = "{id}"
		}
	}
	return strings.Join(parts, "/")
}

// ─── Helper Functions ────────────────────────────────────────────────────

// RecordDBQuery records the duration of a database query.
// Usage:
//
//	defer metrics.RecordDBQuery("select", "students", time.Now())()
//
// Or:
//
//	done := metrics.RecordDBQuery("select", "students", time.Now())
//	// ... execute query ...
//	done()
func RecordDBQuery(queryType, table string, start time.Time) func() {
	return func() {
		DBQueryDuration.WithLabelValues(queryType, table).Observe(time.Since(start).Seconds())
	}
}

// ObserveDBQuery records a completed query duration directly.
func ObserveDBQuery(queryType, table string, duration time.Duration) {
	DBQueryDuration.WithLabelValues(queryType, table).Observe(duration.Seconds())
}

// RecordCacheHit increments the cache hit counter for a key pattern.
func RecordCacheHit(keyPattern string) {
	RedisCacheHits.WithLabelValues(keyPattern).Inc()
}

// RecordCacheMiss increments the cache miss counter for a key pattern.
func RecordCacheMiss(keyPattern string) {
	RedisCacheMisses.WithLabelValues(keyPattern).Inc()
}

// KeyPattern extracts a pattern from a cache key for metric labeling.
// e.g., "dash:school_1:ay_2025" → "dash:*"
func KeyPattern(key string) string {
	parts := strings.SplitN(key, ":", 2)
	if len(parts) > 0 {
		return parts[0] + ":*"
	}
	return key
}
