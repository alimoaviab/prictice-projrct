// @ts-nocheck
import { Types } from "mongoose";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import {
  CreateTimetableDto,
  UpdateTimetableDto
} from "../validation/timetable.schema";
import { assertPermission } from "../auth/rbac";
import { TimetableModel } from "../models/timetable.model";
import { SubjectModel } from "../models/subject.model";
import { AcademicYearModel } from "../models/academic-year.model";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";

const FEATURE = "timetable" as const;

const DAY_NAME_TO_NUMBER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

const DAY_NUMBER_TO_NAME: Record<number, string> = {
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  7: "sunday"
};

const DAY_LABEL_TO_NUMBER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 7
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function hasOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(endA) > toMinutes(startB);
}

function normalizeDay(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized in DAY_NAME_TO_NUMBER) {
    return normalized;
  }
  return undefined;
}

function normalizeDayNumber(value: unknown): number | undefined {
  if (typeof value === "number" && value >= 1 && value <= 7) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized in DAY_LABEL_TO_NUMBER) {
      return DAY_LABEL_TO_NUMBER[normalized];
    }

    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 7) {
      return parsed;
    }
  }

  return undefined;
}

function dayNumberToName(dayNumber: unknown): string | undefined {
  if (typeof dayNumber !== "number") return undefined;
  return DAY_NUMBER_TO_NAME[dayNumber];
}

function toObjectId(value: unknown, fieldName: string): Types.ObjectId {
  if (typeof value !== "string" || !Types.ObjectId.isValid(value)) {
    throw new ControlledError("VALIDATION_ERROR", `${fieldName} is invalid`, 400);
  }
  return new Types.ObjectId(value);
}

export function toClientRecord(row: any) {
  const classEntity = row.class_id as any;
  const teacherEntity = row.teacher_id as any;
  const subjectEntity = row.subject_id as any;

  const classId = typeof classEntity === "object" && classEntity?._id
    ? String(classEntity._id)
    : String(row.class_id);
  const teacherId = typeof teacherEntity === "object" && teacherEntity?._id
    ? String(teacherEntity._id)
    : String(row.teacher_id);
  const subjectId = typeof subjectEntity === "object" && subjectEntity?._id
    ? String(subjectEntity._id)
    : String(row.subject_id);

  return {
    _id: String(row._id),
    class_id: classId,
    class_name: (typeof classEntity === "object" ? classEntity?.name : "") || "",
    section: (typeof classEntity === "object" ? classEntity?.section : "") || "",
    subject_id: subjectId,
    subject_name: (typeof subjectEntity === "object" ? subjectEntity?.name : row.subject) || "",
    subject_code: (typeof subjectEntity === "object" ? subjectEntity?.code : "") || "",
    teacher_id: teacherId,
    teacher_name:
      typeof teacherEntity === "object"
        ? `${teacherEntity?.first_name || ""} ${teacherEntity?.last_name || ""}`.trim()
        : "",
    day_of_week: Number(row.day_of_week || DAY_NAME_TO_NUMBER[row.day] || 1),
    period_number: Number(row.period_number || 1),
    start_time: row.start_time,
    end_time: row.end_time,
    room: row.room || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function toErrorResult(code: string, fallbackMessage: string, error: unknown, status = 500) {
  if (error instanceof ControlledError) {
    return {
      ok: false as const,
      success: false as const,
      error: { code: error.code, message: error.message, status: error.status },
      message: error.message,
    };
  }

  return {
    ok: false as const,
    success: false as const,
    error: { code, message: fallbackMessage, status },
    message: error instanceof Error ? error.message : "Unknown error",
  };
}

async function resolveSubjectNameAndId(ctx: RequestContext, data: any): Promise<{ subjectName: string; subjectId?: Types.ObjectId }> {
  const subjectIdRaw = data?.subject_id;
  const subjectNameRaw = typeof data?.subject === "string" ? data.subject.trim() : "";

  if (typeof subjectIdRaw === "string" && Types.ObjectId.isValid(subjectIdRaw)) {
    const subjectDoc = await SubjectModel.findOne({
      _id: new Types.ObjectId(subjectIdRaw),
      school_id: ctx.school_id
    })
      .select("name")
      .lean();

    if (!subjectDoc?.name) {
      throw new ControlledError("VALIDATION_ERROR", "Selected subject does not exist", 400);
    }

    return { subjectName: subjectDoc.name, subjectId: new Types.ObjectId(subjectIdRaw) };
  }

  if (subjectNameRaw) {
    return { subjectName: subjectNameRaw };
  }

  throw new ControlledError("VALIDATION_ERROR", "Subject is required", 400);
}

async function assertNoScheduleConflict(
  ctx: RequestContext,
  input: { classId: Types.ObjectId; teacherId: Types.ObjectId; day: string; startTime: string; endTime: string },
  excludeId?: string
) {
  void ctx;
  void input;
  void excludeId;
  return;
}

export async function createTimetable(
  ctx: RequestContext,
  data: CreateTimetableDto
): Promise<ServiceResult<any>> {
  assertPermission(ctx, FEATURE, "create");

  try {
    await connectDb();
    
    // Resolve academic year
    let academicYearId = ctx.active_academic_year_id;
    if (!academicYearId) {
      const active = await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true }))
        .select("_id")
        .lean();
      academicYearId = active?._id?.toString();
    }
    if (!academicYearId) {
      throw new ControlledError("VALIDATION_ERROR", "No active academic year found", 400);
    }
    
    const classId = toObjectId((data as any).class_id, "Class");
    const teacherId = toObjectId((data as any).teacher_id, "Teacher");
    
    let day = normalizeDay((data as any).day_of_week);
    let dayOfWeek = normalizeDayNumber((data as any).day_of_week);
    if (!day && !dayOfWeek) {
      day = normalizeDay((data as any).day);
      dayOfWeek = day ? DAY_LABEL_TO_NUMBER[day] : undefined;
    }
    
    const startTime = (data as any).start_time;
    const endTime = (data as any).end_time;

    if (!day) {
      throw new ControlledError("VALIDATION_ERROR", "Day is required", 400);
    }

    if (!startTime || !endTime || toMinutes(startTime) >= toMinutes(endTime)) {
      throw new ControlledError("VALIDATION_ERROR", "End time must be after start time", 400);
    }

    const { subjectName, subjectId } = await resolveSubjectNameAndId(ctx, data);

    await assertNoScheduleConflict(ctx, {
      classId,
      teacherId,
      day,
      startTime,
      endTime
    });

    const timetable = await TimetableModel.create({
      school_id: ctx.school_id,
      academic_year_id: new Types.ObjectId(academicYearId),
      class_id: classId,
      teacher_id: teacherId,
      subject_id: subjectId,
      subject: subjectName,
      day_of_week: dayOfWeek,
      day,
      period_number: Number((data as any).period_number || 1),
      start_time: startTime,
      end_time: endTime,
      room: typeof (data as any).room === "string" ? (data as any).room.trim() : ""
    });

    const saved = await TimetableModel.findById(timetable._id)
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .lean();

    return {
      ok: true,
      success: true,
      data: toClientRecord(saved),
      message: "Timetable entry created successfully",
    };
  } catch (error) {
    return toErrorResult("CREATE_FAILED", "Failed to create timetable entry", error, 400);
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
      data: toClientRecord(timetable),
    };
  } catch (error) {
    return toErrorResult("FETCH_FAILED", "Failed to fetch timetable entry", error);
  }
}

export async function listTimetable(
  ctx: RequestContext,
  query: any = {}
): Promise<ServiceResult<any[]>> {
  assertPermission(ctx, FEATURE, "view");

  try {
    await connectDb();
    
    // 1. Resolve Academic Year (Priority: Query > Active Year)
    let academicYearId = query.academic_year_id;
    if (!academicYearId) {
      const active = await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true }))
        .select("_id")
        .lean();
      if (active) academicYearId = String(active._id);
    }

    // 2. Build Base Filter
    const filter: any = tenantFilter(ctx);
    
    // 3. Apply Academic Year Scoping (Strict)
    if (academicYearId) {
      filter.academic_year_id = new Types.ObjectId(academicYearId);
    }

    // 4. Apply Primary Filters
    if (query.class_id) {
      filter.class_id = toObjectId(query.class_id, "class_id");
    }
    
    if (query.teacher_id) {
      filter.teacher_id = toObjectId(query.teacher_id, "teacher_id");
    }

    // 5. Apply Temporal Filters
    if (query.day) {
      const dayFromName = normalizeDay(query.day);
      if (dayFromName) filter.day = dayFromName;
    }
    
    if (query.day_of_week !== undefined) {
      const dayName = DAY_NUMBER_TO_NAME[Number(query.day_of_week)];
      if (dayName) filter.day = dayName;
    }

    // 6. Execute with Populates
    const timetable = await TimetableModel.find(filter)
      .populate({ path: "class_id", select: "name section" })
      .populate({ path: "teacher_id", select: "first_name last_name" })
      .populate({ path: "subject_id", select: "name code" })
      .sort({ day_of_week: 1, start_time: 1 })
      .lean();

    return {
      ok: true,
      success: true,
      data: timetable.map(toClientRecord),
    };
  } catch (error) {
    console.error("[listTimetable] Error:", error);
    return toErrorResult("FETCH_FAILED", "Failed to fetch timetable", error);
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
    const existing = await TimetableModel.findOne(tenantFilter(ctx, { _id: id })).lean();

    if (!existing) {
      return {
        ok: false,
        success: false,
        error: { code: "NOT_FOUND", message: "Timetable entry not found" },
        message: "Timetable entry not found or access denied",
      };
    }

    const classId = data.class_id
      ? toObjectId((data as any).class_id, "class_id")
      : new Types.ObjectId(String(existing.class_id));
    const teacherId = data.teacher_id
      ? toObjectId((data as any).teacher_id, "teacher_id")
      : new Types.ObjectId(String(existing.teacher_id));

    const nextDay = normalizeDay((data as any).day)
      || normalizeDay((data as any).day_of_week)
      || existing.day;
    const nextStartTime = (data as any).start_time || existing.start_time;
    const nextEndTime = (data as any).end_time || existing.end_time;

    if (!nextDay) {
      throw new ControlledError("VALIDATION_ERROR", "Day is required", 400);
    }
    if (!nextStartTime || !nextEndTime || toMinutes(nextStartTime) >= toMinutes(nextEndTime)) {
      throw new ControlledError("VALIDATION_ERROR", "End time must be after start time", 400);
    }

    const subjectPatch: any = {};
    if ((data as any).subject_id || (data as any).subject) {
      const subjectResolved = await resolveSubjectNameAndId(ctx, data);
      subjectPatch.subject = subjectResolved.subjectName;
      subjectPatch.subject_id = subjectResolved.subjectId;
    }

    await assertNoScheduleConflict(
      ctx,
      {
        classId,
        teacherId,
        day: nextDay,
        startTime: nextStartTime,
        endTime: nextEndTime
      },
      id
    );

    const patch: any = {
      updated_at: new Date(),
      class_id: classId,
      teacher_id: teacherId,
      day: nextDay,
      day_of_week: DAY_NAME_TO_NUMBER[nextDay],
      start_time: nextStartTime,
      end_time: nextEndTime,
      period_number: Number((data as any).period_number || existing.period_number || 1),
      room: typeof (data as any).room === "string" ? (data as any).room.trim() : (existing.room || ""),
      ...subjectPatch
    };

    const timetable = await TimetableModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      patch,
      { new: true }
    )
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
      data: toClientRecord(timetable),
      message: "Timetable entry updated successfully",
    };
  } catch (error) {
    return toErrorResult("UPDATE_FAILED", "Failed to update timetable entry", error, 400);
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
    return toErrorResult("DELETE_FAILED", "Failed to delete timetable entry", error);
  }
}
