import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { BehaviorModel } from "../models/behavior.model";
import { StudentModel } from "../models/student.model";
import { ClassModel } from "../models/class.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { BehaviorCreateInput, BehaviorUpdateInput, behaviorCreateSchema, behaviorUpdateSchema } from "../validation/behavior.schema";
import { writeAuditLog } from "./audit.service";

// CREATE
export async function createBehavior(
  ctx: RequestContext,
  input: BehaviorCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "create");

    const parsed = behaviorCreateSchema.parse(input);

    // Validate student exists
    const student = await StudentModel.findOne(tenantFilter(ctx, { _id: parsed.student_id })).lean();
    if (!student) throw new Error("Student not found");

    // Validate class exists
    const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
    if (!classroom) throw new Error("Class not found");

    // Get current warning count for student
    const existingRecords = await BehaviorModel.find(
      tenantFilter(ctx, {
        student_id: new Types.ObjectId(parsed.student_id),
        status: { $in: ["open", "under_review"] }
      })
    ).lean();
    const warningCount = existingRecords.length + 1;

    const created = await BehaviorModel.create({
      school_id: ctx.school_id,
      student_id: new Types.ObjectId(parsed.student_id),
      class_id: new Types.ObjectId(parsed.class_id),
      reported_by: new Types.ObjectId(ctx.user_id),
      incident_type: parsed.incident_type,
      severity: parsed.severity,
      description: parsed.description,
      action_taken: parsed.action_taken,
      status: parsed.status,
      warning_count: warningCount,
      parent_notified: parsed.parent_notified ?? false,
      notes: parsed.notes
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "behavior",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

// LIST ALL
export async function listBehavior(
  ctx: RequestContext,
  query: { status?: string; severity?: string; incident_type?: string; student_id?: string; class_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "view");

    const filter = tenantFilter(ctx);
    if (query.status) filter.status = query.status;
    if (query.severity) filter.severity = query.severity;
    if (query.incident_type) filter.incident_type = query.incident_type;
    if (query.student_id) filter.student_id = new Types.ObjectId(query.student_id);
    if (query.class_id) filter.class_id = new Types.ObjectId(query.class_id);

    const rows = await BehaviorModel.find(filter)
      .populate("student_id", "first_name last_name admission_no")
      .populate("class_id", "name")
      .populate("reported_by", "first_name last_name")
      .sort({ created_at: -1 })
      .lean();

    return rows.map(row => ({
      ...row,
      _id: String((row as any)._id),
      student_id: String(row.student_id),
      student_name: `${(row.student_id as any)?.first_name ?? ""} ${(row.student_id as any)?.last_name ?? ""}`.trim(),
      admission_no: (row.student_id as any)?.admission_no ?? "",
      class_id: String(row.class_id),
      class_name: (row.class_id as any)?.name ?? "",
      reported_by: String(row.reported_by),
      reporter_name: `${(row.reported_by as any)?.first_name ?? ""} ${(row.reported_by as any)?.last_name ?? ""}`.trim()
    }));
  });
}

// GET SINGLE
export async function getBehavior(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "view");

    const row = await BehaviorModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("student_id", "first_name last_name admission_no")
      .populate("class_id", "name")
      .populate("reported_by", "first_name last_name")
      .populate("resolved_by", "first_name last_name")
      .lean();

    if (!row) throw new Error("Behavior record not found");

    return {
      ...row,
      _id: String((row as any)._id)
    };
  });
}

// UPDATE
export async function updateBehavior(
  ctx: RequestContext,
  id: string,
  input: BehaviorUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "update");

    const parsed = behaviorUpdateSchema.parse(input);
    const existing = await BehaviorModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Behavior record not found");

    const patch: any = { ...parsed };
    if (parsed.student_id) patch.student_id = new Types.ObjectId(parsed.student_id);
    if (parsed.class_id) patch.class_id = new Types.ObjectId(parsed.class_id);

    // Auto-resolve if status changed to resolved
    if (parsed.status === "resolved" && (existing as any).status !== "resolved") {
      patch.resolved_at = new Date();
      patch.resolved_by = new Types.ObjectId(ctx.user_id);
    }

    const updated = await BehaviorModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "behavior",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

// DELETE
export async function deleteBehavior(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "delete");

    const existing = await BehaviorModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Behavior record not found");

    await BehaviorModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "behavior",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}

// GET WARNING COUNT (helper for student)
export async function getStudentWarningCount(
  ctx: RequestContext,
  studentId: string
): Promise<ServiceResult<number>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "behavior", "view");

    const count = await BehaviorModel.countDocuments(
      tenantFilter(ctx, {
        student_id: new Types.ObjectId(studentId),
        status: { $in: ["open", "under_review"] }
      })
    );

    return count;
  });
}
