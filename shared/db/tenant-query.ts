import { FilterQuery } from "mongoose";
import { ControlledError, RequestContext } from "../types/core";

type TenantScoped = { school_id: string };

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

export function requirePlatformContext(ctx: RequestContext): void {
  if (ctx.app !== "super_admin" || ctx.role !== "super_admin" || ctx.school_id !== "platform") {
    throw new ControlledError("PLATFORM_ONLY", "This operation requires platform access.", 403);
  }
}
