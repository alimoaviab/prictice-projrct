import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AttendanceModel } from "../models/attendance.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/student.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { AttendanceCreateInput, attendanceCreateSchema } from "../validation/attendance.schema";
import { writeAuditLog } from "./audit.service";

type AttendanceFilter = {
  class_id?: string;
  student_id?: string;
};

export async function listAttendance(
  ctx: RequestContext,
  filter: AttendanceFilter = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "attendance", "view");

    const query: Record<string, unknown> = tenantFilter(ctx);
    if (filter.class_id) {
      query.class_id = new Types.ObjectId(filter.class_id);
    }
    if (filter.student_id) {
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
