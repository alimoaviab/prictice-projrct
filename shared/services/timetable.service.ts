import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { TimetableModel } from "../models/timetable.model";
import { ClassModel } from "../models/class.model";
import { TeacherModel } from "../models/teacher.model";
import { SubjectModel } from "../models/subject.model";
import { RequestContext, ServiceResult, ControlledError } from "../types/core";
import { serviceTry } from "../utils/result";
import { TimetableCreateInput, TimetableUpdateInput, timetableCreateSchema, timetableUpdateSchema } from "../validation/timetable.schema";
import { writeAuditLog } from "./audit.service";

let timetableIndexSyncPromise: Promise<void> | null = null;

async function ensureTimetableIndexesSynced(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  timetableIndexSyncPromise ??= TimetableModel.syncIndexes().then(() => undefined);
  await timetableIndexSyncPromise;
}

// CREATE
export async function createTimetable(
  ctx: RequestContext,
  input: TimetableCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    await ensureTimetableIndexesSynced();
    assertPermission(ctx, "timetable", "create");

    console.log("[timetable.service] Raw input:", JSON.stringify(input, null, 2));
    const parsed = timetableCreateSchema.parse(input);
    console.log("[timetable.service] Parsed input:", JSON.stringify(parsed, null, 2));
    const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
    if (!classroom) throw new ControlledError("NOT_FOUND", "Class not found", 404);

    // Validate teacher exists
    const teacher = await TeacherModel.findOne(tenantFilter(ctx, { _id: parsed.teacher_id })).lean();
    if (!teacher) throw new ControlledError("NOT_FOUND", "Teacher not found", 404);

    // Validate subject exists
    const subject = await SubjectModel.findOne(tenantFilter(ctx, { _id: parsed.subject_id })).lean();
    if (!subject) throw new ControlledError("NOT_FOUND", "Subject not found", 404);

    const timeConflictFilter = tenantFilter(ctx, {
      day_of_week: parsed.day_of_week,
      period_number: parsed.period_number
    });

    const classConflict = await TimetableModel.findOne({
      ...timeConflictFilter,
      class_id: new Types.ObjectId(parsed.class_id)
    }).lean();
    if (classConflict) {
      throw new ControlledError("CONFLICT", "This class already has a subject assigned for this period", 409);
    }

    const subjectConflict = await TimetableModel.findOne({
      ...timeConflictFilter,
      subject_id: new Types.ObjectId(parsed.subject_id)
    }).lean();
    if (subjectConflict) {
      throw new ControlledError("CONFLICT", "This subject is already assigned for this period", 409);
    }

    const roomConflict = parsed.room
      ? await TimetableModel.findOne({
        ...timeConflictFilter,
        room: parsed.room.trim()
      }).lean()
      : null;
    if (roomConflict) {
      throw new ControlledError("CONFLICT", "This room is already occupied for this period", 409);
    }

    const teacherConflict = await TimetableModel.findOne({
      ...timeConflictFilter,
      teacher_id: new Types.ObjectId(parsed.teacher_id)
    }).lean();
    if (teacherConflict) {
      throw new ControlledError("CONFLICT", "This teacher is already assigned to another class for this period", 409);
    }

    const created = await TimetableModel.create({
      school_id: ctx.school_id,
      class_id: new Types.ObjectId(parsed.class_id),
      teacher_id: new Types.ObjectId(parsed.teacher_id),
      subject_id: new Types.ObjectId(parsed.subject_id),
      day_of_week: parsed.day_of_week,
      period_number: parsed.period_number,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      room: parsed.room,
      // academic_year_id removed — not stored from client input anymore
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "timetable",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

// LIST ALL
export async function listTimetable(
  ctx: RequestContext,
  query: { class_id?: string; teacher_id?: string; day_of_week?: number } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "timetable", "view");

    const filter = tenantFilter(ctx);
    if (query.class_id) filter.class_id = new Types.ObjectId(query.class_id);
    if (query.teacher_id) filter.teacher_id = new Types.ObjectId(query.teacher_id);
    if (query.day_of_week !== undefined) filter.day_of_week = query.day_of_week;
    // academic_year_id filter removed

    const rows = await TimetableModel.find(filter)
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .populate("subject_id", "name")
      .sort({ day_of_week: 1, period_number: 1 })
      .lean();

    return rows.map((row: any) => ({
      ...row,
      _id: String(row._id),
      class_id: String(row.class_id),
      class_name: (row.class_id as any)?.name ?? "",
      teacher_id: String(row.teacher_id),
      teacher_name: `${(row.teacher_id as any)?.first_name ?? ""} ${(row.teacher_id as any)?.last_name ?? ""}`.trim(),
      subject_id: String(row.subject_id),
      subject_name: (row.subject_id as any)?.name ?? ""
    }));
  });
}

// GET SINGLE
export async function getTimetable(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "timetable", "view");

    const row = await TimetableModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .populate("subject_id", "name")
      .lean();

    if (!row) throw new Error("Timetable entry not found");

    return {
      ...row,
      _id: String((row as any)._id)
    };
  });
}

// UPDATE
export async function updateTimetable(
  ctx: RequestContext,
  id: string,
  input: TimetableUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    await ensureTimetableIndexesSynced();
    assertPermission(ctx, "timetable", "update");

    const parsed = timetableUpdateSchema.parse(input);
    const existing = await TimetableModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Timetable entry not found");

    const patch: any = { ...parsed };
    if (parsed.class_id) patch.class_id = new Types.ObjectId(parsed.class_id);
    if (parsed.teacher_id) patch.teacher_id = new Types.ObjectId(parsed.teacher_id);
    if (parsed.subject_id) patch.subject_id = new Types.ObjectId(parsed.subject_id);
    // academic_year_id removed from updates
    // Check class, subject, and room conflicts if the assignment or slot changes
    if (parsed.class_id || parsed.subject_id || parsed.room || parsed.day_of_week || parsed.period_number) {
      const nextClassId = patch.class_id ?? (existing as any).class_id;
      const nextSubjectId = patch.subject_id ?? (existing as any).subject_id;
      const nextRoom = typeof patch.room === "string" ? patch.room.trim() : (existing as any).room;
      const nextDayOfWeek = parsed.day_of_week ?? (existing as any).day_of_week;
      const nextPeriodNumber = parsed.period_number ?? (existing as any).period_number;

      const conflictBase = tenantFilter(ctx, {
        day_of_week: nextDayOfWeek,
        period_number: nextPeriodNumber,
        _id: { $ne: new Types.ObjectId(id) }
      });

      const classConflict = await TimetableModel.findOne(
        {
          ...conflictBase,
          class_id: nextClassId
        }
      ).lean();
      if (classConflict) {
        throw new ControlledError("CONFLICT", "This class already has a subject assigned for this period", 409);
      }

      const subjectConflict = await TimetableModel.findOne({
        ...conflictBase,
        subject_id: nextSubjectId
      }).lean();
      if (subjectConflict) {
        throw new ControlledError("CONFLICT", "This subject is already assigned for this period", 409);
      }

      if (nextRoom) {
        const roomConflict = await TimetableModel.findOne({
          ...conflictBase,
          room: nextRoom
        }).lean();
        if (roomConflict) {
          throw new ControlledError("CONFLICT", "This room is already occupied for this period", 409);
        }
      }

      const nextTeacherId = patch.teacher_id ?? (existing as any).teacher_id;
      const teacherConflict = await TimetableModel.findOne({
        ...conflictBase,
        teacher_id: nextTeacherId
      }).lean();
      if (teacherConflict) {
        throw new ControlledError("CONFLICT", "This teacher is already assigned to another class for this period", 409);
      }
    }

    const updated = await TimetableModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "timetable",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

// DELETE
export async function deleteTimetable(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "timetable", "delete");

    const existing = await TimetableModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) throw new Error("Timetable entry not found");

    await TimetableModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "timetable",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
