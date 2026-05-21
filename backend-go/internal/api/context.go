package api

import (
	"context"
	"net/http"
)

// RequestContext mirrors the `RequestContext` interface from
// old-app/shared/types/core.ts. It is built by the auth middleware from the
// JWT and the x-academic-year-id header, then attached to the http.Request
// context for downstream handlers.
type RequestContext struct {
	SchoolID             string   `json:"school_id"`
	UserID               string   `json:"user_id"`
	Role                 string   `json:"role"`
	App                  string   `json:"app"`
	Permissions          []string `json:"permissions"`
	ActiveAcademicYearID string   `json:"active_academic_year_id,omitempty"`
	SessionID            string   `json:"session_id,omitempty"`
	ActorEmail           string   `json:"actor_email,omitempty"`
	IP                   string   `json:"ip,omitempty"`
	UserAgent            string   `json:"user_agent,omitempty"`
}

type ctxKey string

const requestContextKey ctxKey = "edu.request_context"

// WithContext stores a RequestContext on the http.Request context.
func WithContext(parent context.Context, ctx *RequestContext) context.Context {
	return context.WithValue(parent, requestContextKey, ctx)
}

// FromRequest retrieves the RequestContext stored by the auth middleware.
// Returns nil if the request is not authenticated.
func FromRequest(r *http.Request) *RequestContext {
	v := r.Context().Value(requestContextKey)
	if v == nil {
		return nil
	}
	return v.(*RequestContext)
}
