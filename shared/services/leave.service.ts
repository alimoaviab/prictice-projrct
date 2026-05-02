import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { LeaveModel } from "../models/leave.model";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { LeaveCreateInput, LeaveUpdateInput, leaveCreateSchema, leaveUpdateSchema } from "../validation/leave.schema";
import { writeAuditLog } from "./audit.service";

// CREATE (Request leave)
export async function createLeave(
  ctx: RequestContext,
  input: LeaveCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "leave", "create");

    const parsed = leaveCreateSchema.parse(input);

    // Validate requester exists based on type
    if (parsed.requester_type === "student") {
      const student = await StudentModel.findOne(tenantFilter(ctx, { _id: parsed.requester_id })).lean();
      if (!student) throw new Error("Student not found");
    } else if (parsed.requester_type === "teacher") {
      const teacher = await TeacherModel.findOne(tenantFilter(ctx, { _id: parsed.requester_id })).lean();
      if (!teacher) throw new Error("Teacher not found");
    }

    // Validate dates
    const startDate = new Date(parsed.start_date);
    const endDate = new Date(parsed.end_date);
    if (endDate < startDate) {
      throw new Error("End date must be after start date");
    }

    const created = await LeaveModel.create({
      school_id: ctx.school_id,
      requester_type: parsed.requester_type,
      requester_id: new Types.ObjectId(parsed.requester_id),
      requester_name: parsed.requester_name,
      leave_type: parsed.leave_type,
      start_date: startDate,
      end_date: endDate,
      reason: parsed.reason,
      status: "pending",
      attachments: parsed.attachments ?? []
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "leave",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

// LIST ALL (with filters)
export async function listLeave(
  ctx: RequestContext,
  query: { status?: string; requester_type?: string; requester_id?: string; start_date?: string; end_date?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "leave", "view");

    const filter = tenantFilter(ctx);
    if (query.status) filter.status = query.status;
    if (query.requester_type) filter.requester_type = query.requester_type;
    if (query.requester_id) filter.requester_id = new Types.ObjectId(query.requester_id);
    if (query.start_date || query.end_date) {
      filter.start_date = {};
      if (query.start_date) (filter.start_date as any).$gte = new Date(query.start_date);
      if (query.end_date) (filter.start_date as any).$lte = new Date(query.end_date);
    }

    const rows = await LeaveModel.find(filter)
      .populate("requester_id", "first_name last_name")
      .populate("approved_by", "first_name last_name")
      .sort({ created_at: -1 })
      .lean();

    return rows.map(row => ({
      ...row,
      _id: String((row as any)._id),
      requester_id: String((row as any).requester_id),
      requester_name: `${((row as any).requester_id as any)?.first_name ?? ""} ${((row as any).requester_id as any)?.last_name ?? ""}`.trim() || row.requester_name,
      approved_by: row.approved_by ? String(row.approved_by) : null,
      approver_name: row.approved_by ? `${(row.approved_by as any)?.first_name ?? ""} ${(row.approved_by as any)?.last_name ?? ""}`.trim() : null,
      start_date: (row as any).start_date instanceof Date ? (row as any).start_date.toISOString().split("T")[0] : (row as any).start_date,
      end_date: (row as any).end_date instanceof Date ? (row as any).end_date.toISOString().split("T")[0] : (row as any).end_date
    }));
  });
}

// GET SINGLE
export async function getLeave(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "leave", "view");

    const row = await LeaveModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("requester_id", "first_name last_name")
      .populate("approved_by", "first_name last_name")
      .lean();

    if (!row) throw new Error("Leave request not found");

    return {
      ...row,
      _id: String((row as any)._id),
      requester_id: String((row as any).requester_id),
      start_date: (row as any).start_date instanceof Date ? (row as any).start_date.toISOString().split("T")[0] : (row as any).start_date,
      end_date: (row as any).end_date instanceof Date ? (row as any).end_date.toISOString().split("T")[0] : (row as any).end_date
    };
  });
}

// UPDATE (includes approve/reject)
export async function updateLeave(
  ctx: RequestContext,
  id: string,
  input: LeaveUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "leave", "update");

    const parsed = leaveUpdateSchema.parse(input);
    const existing = await LeaveModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Leave request not found");

    // Only pending requests can be updated (unless cancelling)
    if ((existing as any).status !== "pending" && parsed.status !== "cancelled") {
      throw new Error("Only pending requests can be updated");
    }

    const patch: any = { ...parsed };

    // Handle approval/rejection
    if (parsed.status === "approved") {
      patch.approved_by = new Types.ObjectId(ctx.user_id);
      patch.approved_at = new Date();
    } else if (parsed.status === "rejected" && parsed.rejection_reason) {
      patch.rejection_reason = parsed.rejection_reason;
    }

    // Handle date validation if dates are being updated
    if (parsed.start_date || parsed.end_date) {
      const startDate = parsed.start_date ? new Date(parsed.start_date) : (existing as any).start_date;
      const endDate = parsed.end_date ? new Date(parsed.end_date) : (existing as any).end_date;
      if (endDate < startDate) {
        throw new Error("End date must be after start date");
      }
      if (parsed.start_date) patch.start_date = startDate;
      if (parsed.end_date) patch.end_date = endDate;
    }

    const updated = await LeaveModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "leave",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

// DELETE (Cancel request)
export async function deleteLeave(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "leave", "delete");

    const existing = await LeaveModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Leave request not found");

    // Only pending requests can be deleted
    if ((existing as any).status !== "pending") {
      throw new Error("Only pending requests can be cancelled");
    }

    await LeaveModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "leave",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
