// Package middleware contains HTTP middleware: panic recovery, request
// logging, CORS, and JWT auth. Mirrors the responsibilities of
// old-app/school-app/lib/api-utils.ts (`withAuth`/`safeRoute`) and
// old-app/school-app/middleware.ts.
package middleware

import (
	"errors"
	"log"
	"net/http"

	"github.com/eduplexo/backend-go/internal/api"
)

// Recover catches panics from any downstream handler, logs them, and renders
// the canonical 500 ServiceResult envelope so the React frontend keeps its
// existing error-handling code path.
func Recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("[panic] %s %s: %v", r.Method, r.URL.Path, rec)
				err, ok := rec.(error)
				if !ok {
					err = errors.New("internal server error")
				}
				api.WriteResult(w, api.Fail("INTERNAL_ERROR", err.Error(), 500, nil))
			}
		}()
		next.ServeHTTP(w, r)
	})
}
