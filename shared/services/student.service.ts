import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { StudentModel } from "../models/student.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import {
  StudentCreateInput,
  StudentUpdateInput,
  studentCreateSchema,
  studentUpdateSchema
} from "../validation/student.schema";
import { writeAuditLog } from "./audit.service";

export async function listStudents(
  ctx: RequestContext,
  filter: { class_id?: string; status?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "view");
    return StudentModel.find(tenantFilter(ctx, filter)).sort({ last_name: 1, first_name: 1 }).lean();
  });
}

export async function createStudent(
  ctx: RequestContext,
  input: StudentCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "create");

    const parsed = studentCreateSchema.parse(input);
    const created = await StudentModel.create({
      ...parsed,
      class_id: new Types.ObjectId(parsed.class_id),
      school_id: ctx.school_id
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "student",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

export async function updateStudent(
  ctx: RequestContext,
  id: string,
  input: StudentUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "update");

    const parsed = studentUpdateSchema.parse(input);
    const existing = await StudentModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Student not found.");
    }

    const patch = {
      ...parsed,
      ...(parsed.class_id ? { class_id: new Types.ObjectId(parsed.class_id) } : {})
    };

    const updated = await StudentModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "student",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}
