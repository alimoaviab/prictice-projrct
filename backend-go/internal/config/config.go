// Package config loads runtime configuration from environment variables.
// Mirrors the small env file in old-app/school-app/config/env.ts plus the
// few env reads scattered through the original Node services.
package config

import (
	"log"
	"os"
)

// Config is the validated runtime config for the Go backend.
type Config struct {
	// Port the HTTP server listens on. Default 8080 to match the docker-compose
	// expectation called out in the migration prompt.
	Port string

	// JWTSecret is HMAC-SHA256 secret used to sign and verify session tokens.
	// MUST match the secret of any environment that issued tokens we accept.
	JWTSecret string

	// AppName matches the `app` claim of issued tokens. The Node backend uses
	// "school" for school-app tokens — preserve that exact value so existing
	// frontend tokens continue to validate.
	AppName string

	// AllowedOrigins is the CORS allowlist. The frontend dev server runs on
	// http://localhost:3000.
	AllowedOrigins []string

	// CookieSecure controls the Secure flag on the session cookie. Off in dev.
	CookieSecure bool

	// DatabaseURL is the PostgreSQL DSN. Leave empty to run in pure
	// in-memory mode (development convenience only — no durability).
	DatabaseURL string

	// RedisURL is the Redis connection string (e.g. "redis://redis:6379/0").
	// Leave empty to run without caching — the cache layer degrades gracefully.
	RedisURL string

	// UseDirectPG enables direct PostgreSQL queries instead of MemStore.
	// Set to "true" to bypass MemStore entirely. Can also be controlled
	// per-entity via USE_DIRECT_PG_STUDENTS, USE_DIRECT_PG_TEACHERS, etc.
	UseDirectPG bool

	// GeminiAPIKey for the AI School Assistant (Google Gemini).
	GeminiAPIKey    string
	GeminiModel     string
	GeminiTimeoutMs int

	// AnthropicAPIKey for the SEO Engine (Claude).
	AnthropicAPIKey string
}

// Load reads env vars (with sensible defaults for local development) and
// warns when a critical var is missing.
func Load() Config {
	cfg := Config{
		Port:            getenv("PORT", "8080"),
		JWTSecret:       os.Getenv("JWT_SECRET"),
		AppName:         getenv("APP_NAME", "school"),
		AllowedOrigins:  splitCSV(getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173")),
		CookieSecure:    os.Getenv("COOKIE_SECURE") == "true",
		DatabaseURL:     os.Getenv("DATABASE_URL"),
		RedisURL:        os.Getenv("REDIS_URL"),
		UseDirectPG:     os.Getenv("USE_DIRECT_PG") == "true",
		GeminiAPIKey:    os.Getenv("GEMINI_API_KEY"),
		GeminiModel:     getenv("GEMINI_MODEL", "gemini-2.0-flash"),
		GeminiTimeoutMs: 2500,
		AnthropicAPIKey: os.Getenv("ANTHROPIC_API_KEY"),
	}

	if cfg.JWTSecret == "" {
		log.Println("[config] WARNING: JWT_SECRET is empty; using development fallback. Set JWT_SECRET for any non-local run.")
		cfg.JWTSecret = "dev-only-jwt-secret-change-me"
	}

	return cfg
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func splitCSV(s string) []string {
	out := []string{}
	current := ""
	for _, r := range s {
		if r == ',' {
			if current != "" {
				out = append(out, current)
				current = ""
			}
			continue
		}
		current += string(r)
	}
	if current != "" {
		out = append(out, current)
	}
	return out
}
