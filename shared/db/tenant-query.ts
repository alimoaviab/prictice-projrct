import { FilterQuery } from "mongoose";
import { ControlledError, RequestContext } from "../types/core";

type TenantScoped = { school_id: string };

export function assertTenantContext(ctx: RequestContext): void {
  if (!ctx.school_id) {
    throw new ControlledError("TENANT_REQUIRED", "A school context is required.", 400);
  }
}

export function tenantFilter<T extends TenantScoped>(
  ctx: RequestContext,
  filter: FilterQuery<T> = {}
): FilterQuery<T> {
  assertTenantContext(ctx);

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
