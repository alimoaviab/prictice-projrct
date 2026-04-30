import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { requirePlatformContext } from "../db/tenant-query";
import { SchoolModel } from "../models/school.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { SchoolCreateInput, schoolCreateSchema } from "../validation/school.schema";
import { writeAuditLog } from "./audit.service";

export async function listSchools(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "view");
    return SchoolModel.find({}).sort({ created_at: -1 }).lean();
  });
}

export async function createSchool(
  ctx: RequestContext,
  input: SchoolCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "create");

    const parsed = schoolCreateSchema.parse(input);
    const created = await SchoolModel.create({
      ...parsed,
      code: parsed.code.toUpperCase(),
      created_by: ctx.user_id
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "school",
      entity_id: parsed.school_id,
      after: created.toObject()
    });

    return created.toObject();
  });
}

export async function setSchoolBlocked(
  ctx: RequestContext,
  schoolId: string,
  blocked: boolean
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "update");

    const before = await SchoolModel.findOne({ school_id: schoolId }).lean();
    const after = await SchoolModel.findOneAndUpdate(
      { school_id: schoolId },
      { $set: { status: blocked ? "blocked" : "active", updated_by: ctx.user_id } },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: blocked ? "block" : "unblock",
      entity_type: "school",
      entity_id: schoolId,
      before,
      after
    });

    return after;
  });
}
