// Package audit ports old-app/shared/services/audit.service.ts.
//
// Audit writes use a dedicated mutex (not the main store lock) so they can
// be called from within other handlers that already hold the store mutex —
// the original `writeAuditLog` is invoked the same way (post-mutation) in
// every Mongoose service.
package audit

import (
	"sync"
	"time"

	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

// Input mirrors the `AuditInput` interface in the original Node service.
type Input struct {
	Action     string
	EntityType string
	EntityID   string
	Before     any
	After      any
	Metadata   any
}

var auditMu sync.Mutex

// Write inserts an audit log entry. Always called inside a service that has
// already validated `ctx.SchoolID`. Errors are intentionally swallowed —
// audit failures must never block the operation.
func Write(s *store.MemStore, ctx *api.RequestContext, in Input) {
	defer func() {
		_ = recover()
	}()

	auditMu.Lock()
	defer auditMu.Unlock()

	s.AuditLogs = append(s.AuditLogs, &store.AuditLog{
		ID:         store.NewID("aud"),
		SchoolID:   ctx.SchoolID,
		ActorID:    ctx.UserID,
		ActorRole:  ctx.Role,
		ActorEmail: ctx.ActorEmail,
		Action:     in.Action,
		EntityType: in.EntityType,
		EntityID:   in.EntityID,
		Before:     in.Before,
		After:      in.After,
		Metadata:   in.Metadata,
		CreatedAt:  time.Now(),
	})
}
