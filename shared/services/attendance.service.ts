// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { buildPaginatedResponse, parsePagination, type Paginated } from "../db/pagination";
import { AttendanceModel } from "../models/attendance.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/student.model";
import { TeacherModel } from "../models/teacher.model";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { AttendanceCreateInput, AttendanceUpdateInput, attendanceCreateSchema, attendanceUpdateSchema } from "../validation/attendance.schema";
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";
import { resolveTeacherClassIds } from "./teacher.service";
import { writeAuditLog } from "./audit.service";

type AttendanceFilter = {
  class_id?: string;
  student_id?: string;
  academic_year_id?: string;
  date?: string;
  period?: number | string;
  status?: string;
  page?: string | number;
  limit?: string | number;
};

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
): Promise<ServiceResult<unknown[] | Paginated<unknown>>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "view");

    const query: Record<string, unknown> = tenantFilter(ctx);

    if (ctx.role === "teacher") {
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      if (filter.class_id) {
        if (!hasClassAccess(teacherClassIds, filter.class_id)) {
           throw new ControlledError("FORBIDDEN", "You can only view attendance for assigned classes.", 403);
        }
        query.class_id = new Types.ObjectId(filter.class_id);
      } else {
        query.class_id = { $in: teacherClassIds };
      }
    } else if (ctx.role === "student") {
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
    } else if (filter.class_id) {
        query.class_id = new Types.ObjectId(filter.class_id);
    }

    // Resolve Academic Year strictly (also validates explicit/stale IDs)
    const { resolveAcademicYearId } = await import("./_academic-year-filter");
    const academicYearId = await resolveAcademicYearId(ctx, filter.academic_year_id);

    if (academicYearId) {
      query.academic_year_id = new Types.ObjectId(academicYearId);
    }

    if (ctx.role !== "student" && filter.student_id) {
      query.student_id = new Types.ObjectId(filter.student_id);
    }

    if (filter.date) {
      const d = new Date(filter.date);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    if (filter.period !== undefined) {
      query.period = Number(filter.period);
    }

    if (filter.status) {
      query.status = filter.status;
    }

    const pagination = parsePagination(filter, { defaultLimit: 50, maxLimit: 200 });

    const baseQuery = AttendanceModel.find(query)
      .populate("student_id", "admission_no first_name last_name")
      .populate("class_id", "name")
      .sort({ date: -1, createdAt: -1 });

    const [rowsRaw, total] = pagination.enabled
      ? await Promise.all([
          baseQuery.skip(pagination.skip).limit(pagination.limit).lean(),
          AttendanceModel.countDocuments(query)
        ])
      : [await baseQuery.lean(), 0];

    const items = (rowsRaw as any[]).map((row) => {
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

    if (!pagination.enabled) {
      return items;
    }

    return buildPaginatedResponse(items, total, pagination);
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

export async function markAttendanceBulk(
  ctx: RequestContext,
  input: any
): Promise<ServiceResult<{ saved: number }>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "create");

    const { attendanceBulkMarkSchema } = await import("../validation/attendance.schema");
    const parsed = attendanceBulkMarkSchema.parse(input);
    const { class_id, date, records, remarks, period } = parsed;

    // Resolve academic year if not provided
    let ayId = parsed.academic_year_id;
    if (!ayId) {
      const { AcademicYearModel } = await import("../models/academic-year.model");
      const ay = await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true })).select("_id").lean();
      if (!ay) throw new Error("No active academic year found.");
      ayId = String(ay._id);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const toId = (id: string | undefined) => {
      if (!id || id === "undefined") return undefined;
      if (/^[0-9a-fA-F]{24}$/.test(id)) return new Types.ObjectId(id);
      
      // If it's a mock ID (like "dev-user-id"), we must convert it to a valid 24-char hex
      // so Mongoose schema validation doesn't fail.
      const hex = Buffer.from(id).toString('hex').padEnd(24, '0').substring(0, 24);
      return new Types.ObjectId(hex);
    };

    const studentIds = Object.keys(records);
    
    // Fetch students to get their actual database IDs and class_ids
    const students = await StudentModel.find({
      school_id: ctx.school_id,
      _id: { $in: studentIds.map(id => toId(id)).filter(Boolean) }
    }).select("_id class_id").lean();

    // Map by BOTH original ID (if mock) and DB ID to ensure we can find them
    const studentMap = new Map();
    students.forEach(s => {
      studentMap.set(String(s._id), s);
    });

    const operations = studentIds.map((studentId) => {
      // Find the student by the ID provided from frontend
      const idToFind = toId(studentId);
      const student = students.find(s => String(s._id) === String(idToFind));
      
      if (!student) return null;

      const studentClassId = student.class_id || class_id;
      if (!studentClassId) return null;

      const studentIdObj = student._id; // Use the REAL ID from database
      const classIdObj = toId(studentClassId);
      const ayIdObj = toId(ayId);
      const userIdObj = toId(ctx.user_id);

      return {
        updateOne: {
          filter: {
            school_id: ctx.school_id,
            academic_year_id: ayIdObj,
            class_id: classIdObj,
            student_id: studentIdObj,
            date: attendanceDate,
            period: period || 1
          },
          update: {
            $set: {
              status: records[studentId],
              note: remarks?.[studentId] || "",
              marked_by: userIdObj,
              source: "manual",
              updatedAt: new Date()
            }
          },
          upsert: true
        }
      };
    }).filter(Boolean);

    if (operations.length > 0) {
      await AttendanceModel.bulkWrite(operations as any);
    }

    return { saved: operations.length };
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
