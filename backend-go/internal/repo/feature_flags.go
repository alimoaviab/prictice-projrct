// feature_flags.go — Feature flag system for gradual MemStore → PG migration.
//
// Environment variable: USE_DIRECT_PG=true/false (default: false)
//
// Per-entity flags allow migrating one entity at a time:
//
//	USE_DIRECT_PG_STUDENTS=true
//	USE_DIRECT_PG_TEACHERS=true
//	USE_DIRECT_PG_CLASSES=true
//	USE_DIRECT_PG_FEES=true
//
// When USE_DIRECT_PG=true, ALL entities use direct PG.
// When USE_DIRECT_PG=false, individual flags control per-entity behavior.
//
// Usage in handlers:
//
//	if repo.UseDirectPG("students") {
//	    students, total, err := studentRepo.List(ctx, schoolID, yearID, opts)
//	} else {
//	    // existing MemStore logic
//	}
package repo

import (
	"os"
	"strings"
	"sync"
)

var (
	flagsOnce sync.Once
	flags     featureFlags
)

type featureFlags struct {
	// Global flag: if true, all entities use direct PG
	globalDirectPG bool

	// Per-entity flags
	entities map[string]bool
}

func loadFlags() {
	flagsOnce.Do(func() {
		flags.globalDirectPG = envBool("USE_DIRECT_PG", false)
		flags.entities = map[string]bool{
			"students":   envBool("USE_DIRECT_PG_STUDENTS", false),
			"teachers":   envBool("USE_DIRECT_PG_TEACHERS", false),
			"classes":    envBool("USE_DIRECT_PG_CLASSES", false),
			"fees":       envBool("USE_DIRECT_PG_FEES", false),
			"attendance": envBool("USE_DIRECT_PG_ATTENDANCE", false),
		}
	})
}

// UseDirectPG returns true if the given entity should use direct PG queries
// instead of MemStore.
//
// Priority:
//  1. USE_DIRECT_PG=true → all entities use PG
//  2. USE_DIRECT_PG_{ENTITY}=true → specific entity uses PG
//  3. Default: false (use MemStore)
func UseDirectPG(entity string) bool {
	loadFlags()
	if flags.globalDirectPG {
		return true
	}
	return flags.entities[strings.ToLower(entity)]
}

// SetDirectPG allows runtime override (useful for testing).
func SetDirectPG(entity string, enabled bool) {
	loadFlags()
	flags.entities[strings.ToLower(entity)] = enabled
}

// SetGlobalDirectPG enables/disables direct PG for all entities at runtime.
func SetGlobalDirectPG(enabled bool) {
	loadFlags()
	flags.globalDirectPG = enabled
}

func envBool(key string, defaultVal bool) bool {
	v := strings.TrimSpace(os.Getenv(key))
	switch strings.ToLower(v) {
	case "true", "1", "yes":
		return true
	case "false", "0", "no":
		return false
	default:
		return defaultVal
	}
}
