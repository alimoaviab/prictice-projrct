// pprof.go — Debug profiling endpoints (non-production only).
//
// Exposes Go's net/http/pprof endpoints for memory, CPU, and goroutine profiling.
// Only enabled when ENABLE_PPROF=true environment variable is set.
//
// Usage (from terminal):
//
//	# Heap profile (memory allocations)
//	curl -o heap.prof http://localhost:8080/debug/pprof/heap
//	go tool pprof -http=:6060 heap.prof
//
//	# Goroutine profile (detect leaks)
//	curl -o goroutine.prof http://localhost:8080/debug/pprof/goroutine
//	go tool pprof -http=:6061 goroutine.prof
//
//	# CPU profile (30 seconds)
//	curl -o cpu.prof "http://localhost:8080/debug/pprof/profile?seconds=30"
//	go tool pprof -http=:6062 cpu.prof
//
//	# All goroutines (text, for quick debugging)
//	curl http://localhost:8080/debug/pprof/goroutine?debug=1
//
//	# Memory stats (text)
//	curl http://localhost:8080/debug/pprof/heap?debug=1
//
// SECURITY: Never enable in production. These endpoints expose internal state.
package server

import (
	"net/http/pprof"
	"os"

	"github.com/go-chi/chi/v5"
)

// RegisterPprof adds /debug/pprof/* routes if ENABLE_PPROF=true.
// Call this in Router() after creating the chi mux.
func RegisterPprof(r chi.Router) {
	if os.Getenv("ENABLE_PPROF") != "true" {
		return
	}

	r.Route("/debug/pprof", func(r chi.Router) {
		r.Get("/", pprof.Index)
		r.Get("/cmdline", pprof.Cmdline)
		r.Get("/profile", pprof.Profile)
		r.Get("/symbol", pprof.Symbol)
		r.Post("/symbol", pprof.Symbol)
		r.Get("/trace", pprof.Trace)

		// Specific profiles
		r.Get("/allocs", pprof.Handler("allocs").ServeHTTP)
		r.Get("/block", pprof.Handler("block").ServeHTTP)
		r.Get("/goroutine", pprof.Handler("goroutine").ServeHTTP)
		r.Get("/heap", pprof.Handler("heap").ServeHTTP)
		r.Get("/mutex", pprof.Handler("mutex").ServeHTTP)
		r.Get("/threadcreate", pprof.Handler("threadcreate").ServeHTTP)
	})
}
