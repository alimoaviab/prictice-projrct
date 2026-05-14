package middleware

import (
	"net/http"

	"github.com/eduplexo/backend-go/internal/config"
	"github.com/go-chi/cors"
)

// NewCORS returns the chi CORS middleware preconfigured to match the React
// frontend's expectations: credentialed requests, JSON content, the
// `x-academic-year-id` override header, and the standard set of methods.
//
// The frontend passes `credentials: "include"` on every fetch so the session
// cookie reaches the server, which means we cannot use `*` for the origin —
// the allowlist comes from config.
func NewCORS(cfg config.Config) func(http.Handler) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins: cfg.AllowedOrigins,
		AllowedMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Authorization",
			"Content-Type",
			"X-Academic-Year-Id",
			"x-academic-year-id",
			"Accept",
		},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           300,
	})
}
