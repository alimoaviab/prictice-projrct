import { RequestContext } from "../types/core";

/**
 * ENTERPRISE SECURITY AUDIT MIDDLEWARE
 * 
 * This middleware provides comprehensive security validation for multi-tenant SaaS.
 * It ensures:
 * 1. Tenant isolation (no cross-school access)
 * 2. Academic year isolation (no cross-year data leakage)
 * 3. Role-based access control
 * 4. Query parameter validation
 * 5. Audit logging
 */

export interface SecurityAuditOptions {
  requireAcademicYear?: boolean;
  allowedRoles?: string[];
  logAccess?: boolean;
}

export class SecurityViolationError extends Error {
  code: string;
  status: number;
  details: unknown;

  constructor(code: string, message: string, status = 403, details?: unknown) {
    super(message);
    this.name = "SecurityViolationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/**
 * Validates that the request context has proper tenant isolation
 */
export function validateTenantIsolation(ctx: RequestContext): void {
  if (!ctx.school_id || ctx.school_id === "") {
    throw new SecurityViolationError(
      "MISSING_TENANT",
      "Request must include valid school context",
      403,
      { school_id: ctx.school_id }
    );
  }

  // In production, never allow dev contexts
  if (process.env.NODE_ENV === "production" && ctx.school_id === "dev-school-id") {
    throw new SecurityViolationError(
      "INVALID_TENANT",
      "Development tenant context not allowed in production",
      403
    );
  }
}

/**
 * Validates that the request context has proper academic year isolation
 */
export function validateAcademicYearIsolation(ctx: RequestContext, required = true): void {
  if (required && !ctx.active_academic_year_id) {
    throw new SecurityViolationError(
      "MISSING_ACADEMIC_YEAR",
      "Request must include active academic year context",
      403,
      { active_academic_year_id: ctx.active_academic_year_id }
    );
  }
}

/**
 * Validates that query parameters don't attempt cross-tenant access
 */
export function validateQueryParameters(
  ctx: RequestContext,
  queryParams: Record<string, unknown>
): void {
  // Check for school_id in query params
  if (queryParams.school_id && queryParams.school_id !== ctx.school_id) {
    throw new SecurityViolationError(
      "CROSS_TENANT_ATTEMPT",
      "Cannot access data from different school",
      403,
      {
        requested_school: queryParams.school_id,
        user_school: ctx.school_id
      }
    );
  }

  // Check for academic_year_id in query params
  if (
    queryParams.academic_year_id &&
    ctx.active_academic_year_id &&
    queryParams.academic_year_id !== ctx.active_academic_year_id
  ) {
    throw new SecurityViolationError(
      "CROSS_ACADEMIC_YEAR_ATTEMPT",
      "Cannot access data from different academic year without explicit permission",
      403,
      {
        requested_year: queryParams.academic_year_id,
        active_year: ctx.active_academic_year_id
      }
    );
  }
}

/**
 * Validates role-based access
 */
export function validateRoleAccess(ctx: RequestContext, allowedRoles: string[]): void {
  if (!allowedRoles.includes(ctx.role)) {
    throw new SecurityViolationError(
      "INSUFFICIENT_ROLE",
      `This action requires one of: ${allowedRoles.join(", ")}`,
      403,
      {
        user_role: ctx.role,
        required_roles: allowedRoles
      }
    );
  }
}

/**
 * Comprehensive security audit for a request
 */
export function auditRequest(
  ctx: RequestContext,
  options: SecurityAuditOptions = {}
): void {
  // Always validate tenant isolation
  validateTenantIsolation(ctx);

  // Validate academic year if required
  if (options.requireAcademicYear) {
    validateAcademicYearIsolation(ctx, true);
  }

  // Validate role access if specified
  if (options.allowedRoles && options.allowedRoles.length > 0) {
    validateRoleAccess(ctx, options.allowedRoles);
  }

  // Log access if enabled
  if (options.logAccess) {
    console.log("[SECURITY_AUDIT]", {
      timestamp: new Date().toISOString(),
      user_id: ctx.user_id,
      school_id: ctx.school_id,
      academic_year_id: ctx.active_academic_year_id,
      role: ctx.role,
      ip: ctx.ip,
      user_agent: ctx.user_agent
    });
  }
}

/**
 * Sanitizes data to prevent information leakage
 * Removes sensitive fields before sending to client
 */
export function sanitizeOutput<T extends Record<string, unknown>>(
  data: T,
  ctx: RequestContext
): T {
  const sanitized = { ...data };

  // Remove password hashes
  delete sanitized.password_hash;
  delete sanitized.password;

  // Verify school_id matches context (prevent data leakage)
  if (sanitized.school_id && sanitized.school_id !== ctx.school_id) {
    throw new SecurityViolationError(
      "DATA_LEAKAGE_PREVENTED",
      "Attempted to return data from different tenant",
      500,
      {
        data_school: sanitized.school_id,
        user_school: ctx.school_id
      }
    );
  }

  return sanitized;
}

/**
 * Sanitizes array of data
 */
export function sanitizeOutputArray<T extends Record<string, unknown>>(
  data: T[],
  ctx: RequestContext
): T[] {
  return data.map((item) => sanitizeOutput(item, ctx));
}
