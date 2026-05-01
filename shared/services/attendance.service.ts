import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AttendanceModel } from "../models/attendance.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { AttendanceCreateInput, AttendanceUpdateInput, attendanceCreateSchema, attendanceUpdateSchema } from "../validation/attendance.schema";
import { resolveClassIdsForAcademyCare } from "./_academy-care-filter";
import { writeAuditLog } from "./audit.service";

type AttendanceFilter = {
  class_id?: string;
  student_id?: string;
  academy_care_id?: string;
};

async function resolveTeacherClassIds(ctx: RequestContext): Promise<Types.ObjectId[]> {
  const teacher = (await TeacherModel.findOne(
    tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })
  )
    .select("class_ids")
    .lean()) as { class_ids?: unknown[] } | null;

  if (!teacher?.class_ids?.length) {
    return [];
  }

  return teacher.class_ids.map((id) => new Types.ObjectId(String(id)));
}

function hasClassAccess(classIds: Types.ObjectId[], classId: string): boolean {
  return classIds.some((id) => String(id) === classId);
}

function intersectClassIds(a: Types.ObjectId[], b: Types.ObjectId[]): Types.ObjectId[] {
  const right = new Set(b.map((id) => String(id)));
  return a.filter((id) => right.has(String(id)));
}

export async function listAttendance(
  ctx: RequestContext,
  filter: AttendanceFilter = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "view");

    const query: Record<string, unknown> = tenantFilter(ctx);

    let classIds = await resolveClassIdsForAcademyCare(ctx, filter.academy_care_id);

    if (ctx.role === "teacher") {
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      classIds = intersectClassIds(classIds, teacherClassIds);
    }

    if (ctx.role === "student") {
      const selfStudent = (await StudentModel.findOne(
        tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })
      )
        .select("_id class_id")
        .lean()) as { _id?: unknown; class_id?: unknown } | null;

      if (!selfStudent?._id) {
        return [];
      }

      query.student_id = new Types.ObjectId(String(selfStudent._id));
      query.class_id = new Types.ObjectId(String(selfStudent.class_id));

      if (filter.student_id && filter.student_id !== String(selfStudent._id)) {
        throw new ControlledError("FORBIDDEN", "You can only view your own attendance.", 403);
      }
      if (filter.class_id && filter.class_id !== String(selfStudent.class_id)) {
        throw new ControlledError("FORBIDDEN", "You can only view attendance for your class.", 403);
      }
    }

    if (ctx.role !== "student" && filter.class_id) {
      if (ctx.role === "teacher" && !hasClassAccess(classIds, filter.class_id)) {
        throw new ControlledError("FORBIDDEN", "You can only view attendance for assigned classes.", 403);
      }
      query.class_id = new Types.ObjectId(filter.class_id);
    } else if (ctx.role !== "student") {
      query.class_id = { $in: classIds };
    }
    if (ctx.role !== "student" && filter.student_id) {
      query.student_id = new Types.ObjectId(filter.student_id);
    }

    const rows = await AttendanceModel.find(query)
      .populate("student_id", "admission_no first_name last_name")
      .populate("class_id", "name")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return rows.map((row) => {
      const student = row.student_id as {
        _id?: unknown;
        admission_no?: string;
        first_name?: string;
        last_name?: string;
      };
      const classroom = row.class_id as { _id?: unknown; name?: string };

      return {
        ...row,
        _id: String(row._id),
        student_id: student?._id ? String(student._id) : String(row.student_id),
        class_id: classroom?._id ? String(classroom._id) : String(row.class_id),
        student_name: `${student?.first_name ?? ""} ${student?.last_name ?? ""}`.trim(),
        admission_no: student?.admission_no ?? "",
        class_name: classroom?.name ?? "",
        marked_by: String(row.marked_by),
        date: row.date instanceof Date ? row.date.toISOString().split("T")[0] : row.date
      };
    });
  });
}

export async function createAttendance(
  ctx: RequestContext,
  input: AttendanceCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "create");

    const parsed = attendanceCreateSchema.parse(input);

    if (ctx.role === "teacher") {
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      if (!hasClassAccess(teacherClassIds, parsed.class_id)) {
        throw new ControlledError("FORBIDDEN", "You can only mark attendance for assigned classes.", 403);
      }
    }

    const attendanceDate = new Date(parsed.date);
    attendanceDate.setHours(0, 0, 0, 0);

    const student = (await StudentModel.findOne(
      tenantFilter(ctx, { _id: parsed.student_id })
    ).lean()) as any;
    if (!student) {
      throw new Error("Selected student was not found.");
    }

    const classroom = (await ClassModel.findOne(
      tenantFilter(ctx, { _id: parsed.class_id })
    ).lean()) as any;
    if (!classroom) {
      throw new Error("Selected class was not found.");
    }

    if (String(student.class_id) !== parsed.class_id) {
      throw new Error("Selected student does not belong to the selected class.");
    }

    const existing = await AttendanceModel.findOne(
      tenantFilter(ctx, {
        student_id: new Types.ObjectId(parsed.student_id),
        date: attendanceDate
      })
    ).lean();

    if (existing) {
      throw new Error("Attendance already marked for this student on this date.");
    }

    const created = await AttendanceModel.create({
      school_id: ctx.school_id,
      student_id: new Types.ObjectId(parsed.student_id),
      class_id: new Types.ObjectId(parsed.class_id),
      date: attendanceDate,
      status: parsed.status,
      marked_by: new Types.ObjectId(ctx.user_id),
      source: "manual",
      note: parsed.note ?? ""
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "attendance",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

export async function updateAttendance(
  ctx: RequestContext,
  id: string,
  input: AttendanceUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "update");

    const parsed = attendanceUpdateSchema.parse(input);
    const existing = (await AttendanceModel.findOne(
      tenantFilter(ctx, { _id: id })
    ).lean()) as { class_id?: unknown } | null;
    if (!existing) {
      throw new Error("Attendance not found.");
    }

    if (ctx.role === "teacher") {
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      const targetClassId = parsed.class_id || String(existing.class_id);
      if (!hasClassAccess(teacherClassIds, targetClassId)) {
        throw new ControlledError("FORBIDDEN", "You can only edit attendance for assigned classes.", 403);
      }
    }

    if (parsed.student_id) {
      const student = await StudentModel.findOne(tenantFilter(ctx, { _id: parsed.student_id })).lean();
      if (!student) {
        throw new Error("Selected student was not found.");
      }

      const targetClassId = parsed.class_id || String(existing.class_id);
      if (String((student as { class_id?: unknown }).class_id) !== targetClassId) {
        throw new Error("Selected student does not belong to the selected class.");
      }
    }

    if (parsed.class_id) {
      const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
      if (!classroom) {
        throw new Error("Selected class was not found.");
      }
    }

    const patch: any = {};
    if (parsed.status) {
      patch.status = parsed.status;
    }
    if (parsed.note !== undefined) {
      patch.note = parsed.note;
    }
    if (parsed.date) {
      const attendanceDate = new Date(parsed.date);
      attendanceDate.setHours(0, 0, 0, 0);
      patch.date = attendanceDate;
    }
    if (parsed.student_id) {
      patch.student_id = new Types.ObjectId(parsed.student_id);
    }
    if (parsed.class_id) {
      patch.class_id = new Types.ObjectId(parsed.class_id);
    }

    const updated = await AttendanceModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "attendance",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

export async function deleteAttendance(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "delete");

    const existing = (await AttendanceModel.findOne(
      tenantFilter(ctx, { _id: id })
    ).lean()) as { class_id?: unknown } | null;
    if (!existing) {
      throw new Error("Attendance not found.");
    }

    if (ctx.role === "teacher") {
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      if (!hasClassAccess(teacherClassIds, String(existing.class_id))) {
        throw new ControlledError("FORBIDDEN", "You can only delete attendance for assigned classes.", 403);
      }
    }

    await AttendanceModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "attendance",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
