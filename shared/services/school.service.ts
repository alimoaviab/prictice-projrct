import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { requirePlatformContext } from "../db/tenant-query";
import { SchoolModel } from "../models/school.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { SchoolCreateInput, schoolCreateSchema } from "../validation/school.schema";
import { writeAuditLog } from "./audit.service";

export async function listSchools(
  ctx: RequestContext,
  params: { page?: number; limit?: number; search?: string; status?: string; plan?: string } = {}
): Promise<ServiceResult<{ items: unknown[]; total: number }>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "view");

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 10);
    const skip = (page - 1) * limit;

    const query: any = {};
    if (params.search) {
      query.$or = [
        { name: { $regex: params.search, $options: "i" } },
        { "admin_profile.name": { $regex: params.search, $options: "i" } },
        { "admin_profile.email": { $regex: params.search, $options: "i" } },
        { school_id: { $regex: params.search, $options: "i" } }
      ];
    }
    if (params.status) query.status = params.status;
    if (params.plan) query["plan.key"] = params.plan;

    const [items, total] = await Promise.all([
      SchoolModel.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SchoolModel.countDocuments(query)
    ]);

    return { items, total };
  });
}

import { FeePaymentModel } from "../models/fee-payment.model";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ClassModel } from "../models/class.model";

export async function getSuperAdminDashboardStats(ctx: RequestContext): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "view");

    const [
      schoolStats,
      totalStudents,
      totalTeachers,
      totalClasses,
      revenueStats
    ] = await Promise.all([
      SchoolModel.aggregate([
        {
          $group: {
            _id: null,
            totalSchools: { $sum: 1 },
            pendingSchools: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            approvedSchools: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
            suspendedSchools: { $sum: { $cond: [{ $eq: ["$status", "suspended"] }, 1, 0] } }
          }
        }
      ]),
      StudentModel.countDocuments({}),
      TeacherModel.countDocuments({}),
      ClassModel.countDocuments({}),
      FeePaymentModel.aggregate([
        { $match: { status: "completed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            monthlyRevenue: {
              $sum: {
                $cond: [
                  { $gte: ["$payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                  "$amount",
                  0
                ]
              }
            }
          }
        }
      ])
    ]);

    const s = schoolStats[0] || {
      totalSchools: 0,
      pendingSchools: 0,
      approvedSchools: 0,
      suspendedSchools: 0
    };

    const r = revenueStats[0] || { totalRevenue: 0, monthlyRevenue: 0 };

    return {
      ...s,
      ...r,
      totalStudents,
      totalTeachers,
      totalClasses
    };
  });
}

export async function updateSchoolStatus(
  ctx: RequestContext,
  schoolId: string,
  input: { status: string; reason?: string }
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "update");

    const before = await SchoolModel.findOne({ school_id: schoolId }).lean();
    if (!before) throw new Error("School not found");

    const update: any = { 
      status: input.status, 
      updated_by: ctx.user_id 
    };

    if (input.status === "approved") {
      update.approved_by = ctx.user_id;
      update.approved_at = new Date();
    }

    if (input.status === "rejected") {
      update.rejection_reason = input.reason || "";
    }

    const after = await SchoolModel.findOneAndUpdate(
      { school_id: schoolId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "school",
      entity_id: schoolId,
      metadata: { new_status: input.status, reason: input.reason },
      before,
      after
    });

    return after;
  });
}

export async function getSchoolFullDetails(
  ctx: RequestContext,
  schoolId: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    requirePlatformContext(ctx);
    assertPermission(ctx, "schools", "view");

    const school = await SchoolModel.findOne({ school_id: schoolId }).lean();
    if (!school) throw new Error("School not found");

    // Here we can add more logic to fetch recent activity from AuditLogs
    return school;
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
      status: "pending", // Default status for new registrations
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
