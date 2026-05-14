// Package stubs provides the canonical "feature pending" handlers used by
// routes whose Go implementation is not yet ported. Returning the empty
// shape (rather than 404s) keeps the React frontend's UX intact while we
// migrate the remaining domains one at a time.
//
// Lives outside the `domain/` tree so the router (in `internal/api`) can
// import it without creating an import cycle.
package stubs

import (
	"net/http"

	"github.com/eduplexo/backend-go/internal/api"
)

// EmptyArray returns an empty list. Used for the /api/<resource> routes the
// frontend hits during normal navigation but whose CRUD is not yet ported.
func EmptyArray(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok([]any{}))
}

// EmptyObject returns an empty object. Used for /api/<resource>/dashboard or
// settings routes that the frontend reads as a single record.
func EmptyObject(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok(map[string]any{}))
}

// NotImplemented returns a uniform "feature pending" response with HTTP 501.
// Use it for write endpoints that need real business logic before they can
// safely respond. The envelope matches the original `serviceTry` failure
// shape so the React `service-client.ts` displays the message verbatim.
func NotImplemented(message string) http.HandlerFunc {
	if message == "" {
		message = "This action will be available once the matching domain is migrated."
	}
	return func(w http.ResponseWriter, _ *http.Request) {
		api.WriteResult(w, api.Fail("NOT_IMPLEMENTED", message, 501, nil))
	}
}

// FeeDashboardStats returns a zero-valued stats object that matches the
// shape /api/school/fees/dashboard-stats produces.
func FeeDashboardStats(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok(map[string]any{
		"total_collected": 0,
		"total_pending":   0,
		"collection_rate": 0,
		"pending_count":   0,
	}))
}

// FeeLedger returns the empty `summary + rows` shape /api/fees/ledger uses.
func FeeLedger(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok(map[string]any{
		"summary": map[string]any{"total": 0, "paid": 0, "due": 0},
		"rows":    []any{},
	}))
}

// DomainStatus returns the disconnected shape /api/domain/status produces.
func DomainStatus(w http.ResponseWriter, _ *http.Request) {
	api.WriteResult(w, api.Ok(map[string]any{
		"status": "not_configured",
		"domain": nil,
	}))
}
