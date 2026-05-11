import { FilterQuery } from "mongoose";
import { ControlledError, RequestContext } from "../types/core";

type TenantScoped = { school_id: string };
type AcademicYearScoped = { school_id: string; academic_year_id?: unknown };

export function assertTenantContext(ctx: RequestContext): void {
  // Dev mode allows empty/dev school_id for testing
  const isDevContext = process.env.NODE_ENV === "development" && ctx.school_id === "dev-school-id";
  if (!ctx.school_id && !isDevContext) {
    throw new ControlledError("TENANT_REQUIRED", "A school context is required.", 400);
  }
}

export function tenantFilter<T extends TenantScoped>(
  ctx: RequestContext,
  filter: FilterQuery<T> = {}
): FilterQuery<T> {
  assertTenantContext(ctx);

  // Dev mode with dev-school-id: allow queries to work without filtering by school_id
  // This enables testing without needing a real school in the database
  if (process.env.NODE_ENV === "development" && ctx.school_id === "dev-school-id") {
    return filter;
  }

  const requestedSchool = (filter as Record<string, unknown>).school_id;
  if (requestedSchool && requestedSchool !== ctx.school_id) {
    throw new ControlledError("TENANT_MISMATCH", "Cross-tenant access is not allowed.", 403);
  }

  return { ...filter, school_id: ctx.school_id };
}

/**
 * CRITICAL: Academic Year Scoped Query Filter
 * 
 * Automatically filters queries by both school_id AND active_academic_year_id
 * This ensures complete data isolation between academic years.
 * 
 * Use this for entities that should be scoped to academic years:
 * - Attendance
 * - Exams
 * - Results
 * - Homework
 * - Timetables
 * - Fees
 * 
 * @param ctx - Request context containing school_id and active_academic_year_id
 * @param filter - Additional query filters
 * @returns Combined filter with tenant and academic year isolation
 */
export function academicYearFilter<T extends AcademicYearScoped>(
  ctx: RequestContext,
  filter: FilterQuery<T> = {}
): FilterQuery<T> {
  assertTenantContext(ctx);

  // Dev mode bypass
  if (process.env.NODE_ENV === "development" && ctx.school_id === "dev-school-id") {
    return filter;
  }

  // Validate school_id
  const requestedSchool = (filter as Record<string, unknown>).school_id;
  if (requestedSchool && requestedSchool !== ctx.school_id) {
    throw new ControlledError("TENANT_MISMATCH", "Cross-tenant access is not allowed.", 403);
  }

  // Validate academic_year_id if provided in filter
  const requestedAcademicYear = (filter as Record<string, unknown>).academic_year_id;
  if (requestedAcademicYear && ctx.active_academic_year_id && requestedAcademicYear !== ctx.active_academic_year_id) {
    throw new ControlledError("ACADEMIC_YEAR_MISMATCH", "Cross-academic-year access requires explicit permission.", 403);
  }

  // Build scoped filter
  const scopedFilter: FilterQuery<T> = {
    ...filter,
    school_id: ctx.school_id
  };

  // Add academic year filter if context has it and filter doesn't explicitly override
  if (ctx.active_academic_year_id && !requestedAcademicYear) {
    (scopedFilter as Record<string, unknown>).academic_year_id = ctx.active_academic_year_id;
  }

  return scopedFilter;
}

export function requirePlatformContext(ctx: RequestContext): void {
  if (ctx.app !== "super_admin" || ctx.role !== "super_admin" || ctx.school_id !== "platform") {
    throw new ControlledError("PLATFORM_ONLY", "This operation requires platform access.", 403);
  }
}
