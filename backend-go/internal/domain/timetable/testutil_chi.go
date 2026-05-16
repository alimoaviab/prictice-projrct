package timetable

import (
	"context"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// newChiRouteCtx and routeCtxKey are tiny test helpers that let unit
// tests fabricate a chi RouteContext without booting the router. They
// live in the package so the test file can build with no extra
// dependencies.

func newChiRouteCtx(key, value string) *chi.Context {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return rctx
}

func routeCtxKey(r *http.Request, rctx *chi.Context) context.Context {
	return context.WithValue(r.Context(), chi.RouteCtxKey, rctx)
}
