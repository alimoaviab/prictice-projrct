import { Types } from "mongoose";
import { RequestContext, ServiceResult } from "../types/core";
import { 
  CreateTimetableDto, 
  UpdateTimetableDto 
} from "../validation/timetable.schema";
import { assertPermission } from "../auth/rbac";
import { TimetableModel } from "../models/timetable.model";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";

const FEATURE = "timetable" as const;

export async function createTimetable(
  ctx: RequestContext,
  data: CreateTimetableDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "create");

  try {
    await connectDb();
    const timetable = await TimetableModel.create({
      ...data,
      school_id: ctx.school_id,
      class_id: new Types.ObjectId(data.class_id),
      teacher_id: new Types.ObjectId(data.teacher_id),
    });

    return {
      ok: true,
      success: true,
      data: timetable.toObject(),
      message: "Timetable entry created successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "CREATE_FAILED", message: "Failed to create timetable entry" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getTimetable(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    const timetable = await TimetableModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .lean();

    if (!timetable) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Timetable entry not found" },
        message: "Timetable entry not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: timetable,
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch timetable entry" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function listTimetable(
  ctx: RequestContext,
  query: any = {}
): Promise<ServiceResult<any[]>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    const filter = tenantFilter(ctx, query);
    
    if (filter.class_id) filter.class_id = new Types.ObjectId(filter.class_id);
    if (filter.teacher_id) filter.teacher_id = new Types.ObjectId(filter.teacher_id);

    const timetable = await TimetableModel.find(filter)
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .sort({ day: 1, start_time: 1 })
      .lean();

    return {
      ok: true,
      success: true,
      data: timetable,
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "FETCH_FAILED", message: "Failed to fetch timetable" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getTeacherTimetable(
  ctx: RequestContext,
  teacherId: string
): Promise<ServiceResult<any[]>> {
  return listTimetable(ctx, { teacher_id: teacherId });
}

export async function getClassTimetable(
  ctx: RequestContext,
  classId: string
): Promise<ServiceResult<any[]>> {
  return listTimetable(ctx, { class_id: classId });
}

export async function updateTimetable(
  ctx: RequestContext,
  id: string,
  data: UpdateTimetableDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "update");

  try {
    await connectDb();
    const timetable = await TimetableModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { ...data, updated_at: new Date() },
      { new: true, lean: true }
    );

    if (!timetable) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Timetable entry not found" },
        message: "Timetable entry not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: timetable,
      message: "Timetable entry updated successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "UPDATE_FAILED", message: "Failed to update timetable entry" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteTimetable(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<null>> {
  assertPermission(ctx, FEATURE, "delete");

  try {
    await connectDb();
    const result = await TimetableModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    if (!result) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Timetable entry not found" },
        message: "Timetable entry not found or access denied",
      };
    }

    return {
      ok: true,
      success: true,
      data: null,
      message: "Timetable entry deleted successfully",
    };
  } catch (error) {
    return {
      ok: false,
      success: false,
      error: { code: "DELETE_FAILED", message: "Failed to delete timetable entry" },
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
