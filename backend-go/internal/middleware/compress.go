// Package middleware — compress.go adds response compression.
//
// Wraps Chi's built-in Compress middleware to apply Gzip at level 5 to all
// application/json responses. Compression level 5 balances CPU cost vs
// bandwidth savings (~70-80% reduction on typical JSON payloads).
//
// Usage in router.go:
//
//	r.Use(middleware.Compress)
package middleware

import (
	"net/http"

	chimw "github.com/go-chi/chi/v5/middleware"
)

// Compress returns a Chi middleware that applies gzip compression at level 5
// to responses with eligible content types. Chi's Compress middleware
// automatically handles Accept-Encoding negotiation and will skip
// compression for clients that don't support it.
//
// Content types compressed:
//   - application/json (API responses — primary target)
//   - text/plain
//   - text/html
//   - text/css
//   - application/javascript
//   - application/xml
//   - text/xml
func Compress(next http.Handler) http.Handler {
	// Chi's Compress at level 5 (good balance of speed vs compression ratio).
	// Level 5 gives ~70% compression on JSON with minimal CPU overhead.
	// The middleware automatically negotiates gzip/deflate based on
	// the client's Accept-Encoding header.
	compressor := chimw.NewCompressor(5,
		"application/json",
		"text/plain",
		"text/html",
		"text/css",
		"application/javascript",
		"application/xml",
		"text/xml",
	)

	return compressor.Handler(next)
}
