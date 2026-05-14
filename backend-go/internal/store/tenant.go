package store

import (
	"github.com/eduplexo/backend-go/internal/api"
)

// AssertTenantContext mirrors `assertTenantContext` from
// old-app/shared/db/tenant-query.ts. Errors out (with a 400/403) when the
// caller has no school binding.
func AssertTenantContext(ctx *api.RequestContext) error {
	if ctx == nil || ctx.SchoolID == "" {
		return api.NewControlledError("TENANT_REQUIRED", "A school context is required.", 400, nil)
	}
	return nil
}

// CheckSchoolMatch enforces that any explicit school_id in a filter equals
// the caller's school. Mirrors the same check Mongoose `tenantFilter` does.
func CheckSchoolMatch(ctx *api.RequestContext, requestedSchoolID string) error {
	if requestedSchoolID == "" {
		return nil
	}
	if requestedSchoolID != ctx.SchoolID {
		return api.NewControlledError("TENANT_MISMATCH", "Cross-tenant access is not allowed.", 403, nil)
	}
	return nil
}

// CheckAcademicYearMatch mirrors `academicYearFilter`'s cross-year guard.
func CheckAcademicYearMatch(ctx *api.RequestContext, requestedYearID string) error {
	if requestedYearID == "" || ctx.ActiveAcademicYearID == "" {
		return nil
	}
	if requestedYearID != ctx.ActiveAcademicYearID {
		return api.NewControlledError("ACADEMIC_YEAR_MISMATCH", "Cross-academic-year access requires explicit permission.", 403, nil)
	}
	return nil
}
