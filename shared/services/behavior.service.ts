// @ts-nocheck
import mongoose from "mongoose";
import { Types } from "mongoose";
import { RequestContext, ServiceResult } from "../types/core";
import {
  CreateBehaviorDto,
  UpdateBehaviorDto
} from "../validation/behavior.schema";
import { assertPermission } from "../auth/rbac";
import { BehaviorModel, StudentModel } from "../models";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";

const FEATURE = "behavior" as const;

export async function createBehavior(
  ctx: RequestContext,
  data: CreateBehaviorDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "create");

  try {
    await connectDb();

    const student = await StudentModel.findOne(tenantFilter(ctx, { _id: data.student_id })).lean();
    if (!student) {
      return {
        ok: false,
        success: false,
        error: { code: "STUDENT_NOT_FOUND", message: "Student not found" },
        message: "Student not found in this school",
      };
    }

    let teacherId = ctx.user_id;
    if (ctx.role === "teacher") {
      const { TeacherModel } = await import("../models/teacher.model");
      const teacherProfile = await TeacherModel.findOne(tenantFilter(ctx, { user_id: ctx.user_id })).select("_id").lean();
      if (teacherProfile) {
        teacherId = teacherProfile._id;
      }
    }

    const behaviorData = {
      school_id: ctx.school_id,
      student_id: new Types.ObjectId(data.student_id),
      class_id: new Types.ObjectId(data.class_id),
      teacher_id: new Types.ObjectId(teacherId),
      incident_type: data.incident_type,
      description: data.description,
      severity: data.severity,
      action_taken: data.action_taken,
      status: data.status || "open",
      warning_count: data.warning_count ?? 1,
      parent_notified: data.parent_notified ?? false,
      notes: data.notes,
    };

    const created = await BehaviorModel.create(behaviorData);
    return {
      ok: true,
      success: true,
      data: created.toObject(),
      message: "Behavior record created successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "CREATE_FAILED", message: "Failed to create behavior record" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getBehavior(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    const behavior = await BehaviorModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("student_id", "first_name last_name admission_no")
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .lean();

    if (!behavior) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Behavior record not found" },
        message: "Behavior record not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: {
        ...behavior,
        id: String((behavior as any)._id),
      },
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch behavior record" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function listBehavior(
  ctx: RequestContext,
  query: any = {}
): Promise<ServiceResult<any[]>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();

    // Clean query to remove undefined/null filters
    const cleanQuery = {};
    Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null && key !== 'academy_care_id') {
            cleanQuery[key] = query[key];
        }
    });

    const behaviors = await BehaviorModel.find(tenantFilter(ctx, cleanQuery))
      .populate("student_id", "first_name last_name admission_no")
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .sort({ created_at: -1 })
      .lean();

    return {
      ok: true,
      success: true,
      data: behaviors.map(b => ({
        _id: b._id,
        id: b._id,
        student_id: b.student_id?._id || b.student_id,
        student_name: b.student_id ? `${(b.student_id as any).first_name ?? ""} ${(b.student_id as any).last_name ?? ""}`.trim() : "",
        class_id: b.class_id?._id || b.class_id,
        class_name: (b.class_id as any)?.name ?? "",
        teacher_id: b.teacher_id?._id || b.teacher_id,
        teacher_name: b.teacher_id ? `${(b.teacher_id as any).first_name ?? ""} ${(b.teacher_id as any).last_name ?? ""}`.trim() : "",
        incident_type: b.incident_type,
        description: b.description,
        severity: b.severity,
        action_taken: b.action_taken,
        status: b.status,
        warning_count: b.warning_count,
        parent_notified: b.parent_notified,
        notes: b.notes,
        created_at: b.created_at,
      })),
      meta: { count: behaviors.length },
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch behaviors" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function updateBehavior(
  ctx: RequestContext,
  id: string,
  data: UpdateBehaviorDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "update");

  try {
    await connectDb();
    const behavior = await BehaviorModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { ...data, updated_at: new Date() },
      { new: true, lean: true }
    );

    if (!behavior) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Behavior record not found" },
        message: "Behavior record not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: behavior,
      message: "Behavior record updated successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "UPDATE_FAILED", message: "Failed to update behavior record" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteBehavior(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<null>> {
  assertPermission(ctx, FEATURE, "delete");

  try {
    await connectDb();
    const result = await BehaviorModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    if (!result) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Behavior record not found" },
        message: "Behavior record not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: null,
      message: "Behavior record deleted successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "DELETE_FAILED", message: "Failed to delete behavior record" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
