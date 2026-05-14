// Package tenant exposes helpers for resolving the active academic year
// inside a tenant. Mirrors old-app/shared/services/_academic-year-filter.ts.
package tenant

import (
	"github.com/eduplexo/backend-go/internal/api"
	"github.com/eduplexo/backend-go/internal/store"
)

// ResolveAcademicYearID returns the academic year ID the caller intended to
// scope a query to. Resolution order matches the original:
//   1. Explicit `requestedID` if it belongs to the caller's school.
//   2. `ctx.ActiveAcademicYearID` (from the JWT or x-academic-year-id header).
//   3. Whichever year on this tenant has `is_active=true`.
//   4. Empty string if the tenant has no year at all.
func ResolveAcademicYearID(s *store.MemStore, ctx *api.RequestContext, requestedID string) string {
	s.RLock()
	defer s.RUnlock()
	return ResolveAcademicYearIDLocked(s, ctx, requestedID)
}

func ResolveAcademicYearIDLocked(s *store.MemStore, ctx *api.RequestContext, requestedID string) string {
	if requestedID != "" && requestedID != "undefined" {
		for _, y := range s.AcademicYears {
			if y.ID == requestedID && y.SchoolID == ctx.SchoolID {
				return y.ID
			}
		}
	}

	if ctx.ActiveAcademicYearID != "" && ctx.ActiveAcademicYearID != "undefined" {
		for _, y := range s.AcademicYears {
			if y.ID == ctx.ActiveAcademicYearID && y.SchoolID == ctx.SchoolID {
				return y.ID
			}
		}
	}

	for _, y := range s.AcademicYears {
		if y.SchoolID == ctx.SchoolID && y.IsActive {
			return y.ID
		}
	}
	return ""
}
