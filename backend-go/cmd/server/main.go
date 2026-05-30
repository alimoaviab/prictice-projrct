// Command server is the entrypoint for the Eduplexo Go backend.
//
// Boot sequence:
//   1. Load env config.
//   2. Build the in-memory MemStore with seed data.
//   3. Connect to PostgreSQL (if DATABASE_URL is set), then either:
//        - Hydrate the MemStore from PG (existing data), OR
//        - Push the in-memory seed to PG (fresh database).
//   4. Start the background flush + heartbeat goroutine.
//   5. Listen on $PORT.
//   6. On SIGINT/SIGTERM, drain the write queue and snapshot the store.
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/eduplexo/backend-go/internal/cache"
	"github.com/eduplexo/backend-go/internal/config"
	"github.com/eduplexo/backend-go/internal/domain/dashboard"
	"github.com/eduplexo/backend-go/internal/domain/superadmin"
	"github.com/eduplexo/backend-go/internal/persistence"
	"github.com/eduplexo/backend-go/internal/realtime"
	"github.com/eduplexo/backend-go/internal/server"
	"github.com/eduplexo/backend-go/internal/store"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env.local from the parent directory (project root) and the local
	// backend directory. Both are best-effort — missing files are not errors.
	_ = godotenv.Load("../.env.local")
	_ = godotenv.Load(".env.local")
	_ = godotenv.Load(".env")

	cfg := config.Load()
	s := store.New()

	// Always ensure bootstrap users exist (even when running pure in-memory
	// without a database)
	store.EnsureBootstrapUsers(s)

	// Build the in-memory lookup indexes (userByID/userByEmail/schoolByID)
	// so the auth middleware can do O(1) lookups instead of scanning the
	// Users slice on every request. The indexes are refreshed periodically
	// below; a stale entry never breaks correctness because callers fall
	// back to the slice scan on miss.
	s.RebuildIndexes()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pg, err := persistence.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[server] persistence init failed: %v", err)
	}
	defer pg.Close()

	// Initialize Redis cache (graceful — won't crash if Redis is unavailable).
	rdb := cache.New(cfg.RedisURL)
	defer rdb.Close()

	if pg.Available() {
		if err := pg.Load(ctx, s); err != nil {
			log.Fatalf("[server] persistence load failed: %v", err)
		}
		// Ensure bootstrap admin users exist even after loading from PG.
		// This guarantees we can always log in as the platform owner.
		store.EnsureBootstrapUsers(s)
		// Ensure all schools have required default records for every feature.
		// This is the permanent fix for "new features don't apply to old accounts".
		store.EnsureSchoolDefaults(s)
		// Refresh the lookup indexes now that PG has hydrated all users
		// and schools — the maps built earlier only saw the bootstrap
		// rows.
		s.RebuildIndexes()
		// Push the in-memory seed to PG when DB was empty.
		if err := pg.FullSnapshot(ctx, s); err != nil {
			log.Printf("[server] initial snapshot failed: %v", err)
		}
		pg.StartBackground(ctx, 30*time.Second, func(c context.Context) error {
			return pg.FullSnapshot(c, s)
		})

		// Start materialized view refresh goroutine (every 5 minutes).
		go func() {
			// Initial refresh on boot
			if err := dashboard.RefreshMaterializedViews(ctx, pg.Pool()); err != nil {
				log.Printf("[server] initial matview refresh failed: %v", err)
			}
			ticker := time.NewTicker(5 * time.Minute)
			defer ticker.Stop()
			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					if err := dashboard.RefreshMaterializedViews(ctx, pg.Pool()); err != nil {
						log.Printf("[server] matview refresh failed: %v", err)
					}
				}
			}
		}()
	}

	if rdb.Available() {
		saveFn := func(table string, doc any) {
			if pg.Available() {
				if len(table) > 7 && table[len(table)-7:] == ":delete" {
					if s, ok := doc.(string); ok {
						pg.Delete(table[:len(table)-7], s)
					} else {
						pg.DeleteWithDoc(table[:len(table)-7], doc)
					}
				} else {
					pg.Save(table, doc)
				}
			}
		}

		jq := realtime.NewJobQueue(rdb.Raw())
		worker := realtime.NewWorker(rdb.Raw(), jq, nil)
		worker.Register("csv-import", superadmin.HandleCSVImportJob(s, saveFn, jq))
		go worker.Start(ctx)
		log.Println("[server] Redis background worker started for csv-import")
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           server.Router(cfg, s, pg, rdb),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	// Periodic refresh of the in-memory lookup indexes. Handlers that
	// insert/update users (signup, student create, teacher create) keep
	// mutating the slices directly — the indexes stay correct because
	// the auth middleware falls back to a scan when a key is missing,
	// and this ticker promotes those rows to the fast path within ~30s.
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.RebuildIndexes()
			}
		}
	}()

	go func() {
		log.Printf("[server] listening on http://0.0.0.0%s (app=%s, allowed_origins=%v, db=%v)",
			srv.Addr, cfg.AppName, cfg.AllowedOrigins, pg.Available())

		// Print bootstrap credentials for easy login
		s.RLock()
		log.Println("[server] ═══════════════════════════════════════════════════════════")
		log.Println("[server] BOOTSTRAP CREDENTIALS (use to login)")
		for _, u := range s.Users {
			if u.Role == "super_admin" {
				log.Printf("[server]   Super Admin: %s / %s (port 3001)", u.Email, u.PasswordHash)
			}
			if u.Role == "admin" {
				log.Printf("[server]   School Admin: %s / %s (port 3000)", u.Email, u.PasswordHash)
			}
		}
		log.Println("[server] ═══════════════════════════════════════════════════════════")
		s.RUnlock()

		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("[server] listen error: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	log.Printf("[server] shutting down…")
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("[server] shutdown error: %v", err)
	}
	if pg.Available() {
		if err := pg.FullSnapshot(shutdownCtx, s); err != nil {
			log.Printf("[server] final snapshot failed: %v", err)
		}
	}
	cancel()
}
