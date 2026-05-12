import { Types } from "mongoose";
import { ClassModel, StudentModel, AttendanceModel, ExamModel, ResultModel, FeeModel, AcademicYearModel, TeacherModel, SubjectModel } from "../models";
import { tenantFilter } from "../db/tenant-query";
import { serviceTry } from "../utils/result";
import { ControlledError, RequestContext, ServiceResult } from "../types/core";

function extractId(val: any): string {
  if (!val) return "";
  if (typeof val === "object") {
    const id = val._id ?? val.id;
    return id ? String(id) : "";
  }
  const s = String(val);
  return s === "[object Object]" ? "" : s;
}

function toClassName(classRow: any): string {
  const section = classRow.section ? `-${classRow.section}` : "";
  return `${classRow.name ?? ""}${section}`.trim();
}

function normalizeSubjects(classRow: any) {
  const source = Array.isArray(classRow.subject_ids) && classRow.subject_ids.length > 0
    ? classRow.subject_ids
    : classRow.subjects ?? [];

  return source.map((subject: any) => {
    if (typeof subject === "string") return subject;
    return subject?.name || String(subject?._id ?? subject?.id ?? subject ?? "");
  }).filter(Boolean);
}

function toClassSummary(classRow: any) {
  const classTeacher = Array.isArray(classRow.teacher_ids) && classRow.teacher_ids.length > 0
    ? classRow.teacher_ids[0]
    : classRow.class_teacher_id;

  return {
    id: extractId(classRow._id),
    _id: extractId(classRow._id),
    name: classRow.name,
    code: classRow.code ?? "",
    display_order: Number(classRow.display_order ?? 1),
    passing_percentage: Number(classRow.passing_percentage ?? 33),
    section: classRow.section ?? "",
    capacity: Number(classRow.capacity ?? 0),
    enrolled_students: Number(classRow.enrolled_students ?? 0),
    academic_year_id: extractId(classRow.academic_year_id),
    academic_year: classRow.academic_year ?? "",
    class_teacher_id: classTeacher ? extractId(classTeacher) : "",
    teacher_ids: (classRow.teacher_ids ?? []).map((value: unknown) => extractId(value)),
    subjects: normalizeSubjects(classRow),
    room_number: classRow.room_number ?? "",
    description: classRow.description ?? "",
    status: classRow.status ?? "active"
  };
}

async function hydrateClassRows(ctx: RequestContext, rows: any[]) {
  const academicYearIds = rows.map((row) => extractId(row.academic_year_id)).filter(Boolean);
  const teacherIds = rows.flatMap((row) => (row.teacher_ids ?? []).map((value: unknown) => extractId(value))).filter(Boolean);

  const [academicYears, teachers] = await Promise.all([
    academicYearIds.length > 0
      ? AcademicYearModel.find(tenantFilter(ctx, { _id: { $in: academicYearIds } })).lean()
      : Promise.resolve([]),
    teacherIds.length > 0
      ? TeacherModel.find(tenantFilter(ctx, { _id: { $in: teacherIds } })).lean()
      : Promise.resolve([])
  ]);

  const academicYearMap = new Map(academicYears.map((year: any) => [String(year._id), year]));
  const teacherMap = new Map(teachers.map((teacher: any) => [String(teacher._id), teacher]));

  return rows.map((row) => {
    const academicYear = academicYearMap.get(extractId(row.academic_year_id));
    const teacherId = row.class_teacher_id || (row.teacher_ids ?? [])[0];
    const teacher = teacherId ? teacherMap.get(extractId(teacherId)) : null;

    return {
      ...toClassSummary(row),
      academic_year: academicYear?.year ?? row.academic_year ?? "",
      class_teacher: teacher
        ? {
          id: String(teacher._id),
          name: `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim(),
          phone: teacher.phone ?? ""
        }
        : null,
      subjects: (row.subject_ids ?? []).length > 0
        ? row.subjects ?? []
        : row.subjects ?? []
    };
  });
}

export async function listClasses(ctx: RequestContext, query: any = {}): Promise<ServiceResult<any[]>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, query);

    const rows = await ClassModel.find(filter)
      .populate("academic_year_id", "year start_date end_date is_active")
      .populate("teacher_ids", "first_name last_name phone")
      .populate("class_teacher_id", "first_name last_name phone")
      .populate("subject_ids", "name code")
      .sort({ name: 1 })
      .lean();

    const studentCounts = await StudentModel.aggregate([
      { $match: tenantFilter(ctx, query as any) },
      { $group: { _id: "$class_id", count: { $sum: 1 } } }
    ]);
    const countMap = new Map(studentCounts.map((item) => [String(item._id), Number(item.count || 0)]));

    return rows.map((row: any) => ({
      ...toClassSummary({ ...row, enrolled_students: countMap.get(String(row._id)) ?? 0 }),
      academic_year: row.academic_year_id?.year ?? row.academic_year ?? "",
      class_teacher: row.class_teacher_id
        ? {
          id: String(row.class_teacher_id._id ?? row.class_teacher_id),
          name: `${row.class_teacher_id.first_name || ""} ${row.class_teacher_id.last_name || ""}`.trim(),
          phone: row.class_teacher_id.phone ?? ""
        }
        : null,
      subjects: normalizeSubjects(row)
    }));
  });
}

export async function getClass(ctx: RequestContext, id: string): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });
    const cls = await ClassModel.findOne(filter)
      .populate("academic_year_id", "year start_date end_date is_active")
      .populate("teacher_ids", "first_name last_name phone")
      .populate("class_teacher_id", "first_name last_name phone")
      .populate("subject_ids", "name code")
      .lean();
    if (!cls) throw new Error("Class not found");

    const [students, feeRecords, examCount, resultCount] = await Promise.all([
      StudentModel.find(tenantFilter(ctx, { class_id: id, status: "active" }))
        .sort({ last_name: 1, first_name: 1 })
        .lean(),
      FeeModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)).catch(() => 0),
      ExamModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)).catch(() => 0),
      ResultModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)).catch(() => 0)
    ]);

    const enrolledStudents = students.map((student: any) => ({
      id: String(student._id),
      name: `${student.first_name || ""} ${student.last_name || ""}`.trim(),
      roll_no: student.admission_no ?? student.roll_no ?? "",
      enrollment_status: student.status ?? "active"
    }));

    return {
      ...toClassSummary({ ...cls, enrolled_students: students.length }),
      academic_year: (cls as any).academic_year_id?.year ?? (cls as any).academic_year ?? "",
      class_teacher: (cls as any).class_teacher_id
        ? {
          id: String((cls as any).class_teacher_id._id ?? (cls as any).class_teacher_id),
          name: `${(cls as any).class_teacher_id.first_name || ""} ${(cls as any).class_teacher_id.last_name || ""}`.trim(),
          phone: (cls as any).class_teacher_id.phone ?? ""
        }
        : null,
      subjects: normalizeSubjects(cls),
      students: enrolledStudents,
      fee_structure: (cls as any).fee_structure ?? {
        total_annual: 0,
        monthly_recurring: 0,
        fees_configured: feeRecords > 0
      },
      grade_thresholds: (cls as any).grade_thresholds ?? {},
      exam_count: examCount,
      result_count: resultCount
    };
  });
}

export async function createClass(ctx: RequestContext, data: any): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    try {
      const classTeacherIdStr = extractId(data.class_teacher_id);
      const classTeacherId = classTeacherIdStr ? new Types.ObjectId(classTeacherIdStr) : undefined;
      const newClass = new ClassModel({
        school_id: ctx.school_id,
        ...data,
        academic_year_id: extractId(data.academic_year_id),
        capacity: Number(data.capacity ?? 0),
        class_teacher_id: classTeacherId,
        teacher_ids: Array.isArray(data.teacher_ids)
          ? data.teacher_ids.map((value: string) => new Types.ObjectId(extractId(value)))
          : classTeacherId
            ? [classTeacherId]
            : [],
        subject_ids: Array.isArray(data.subject_ids) ? data.subject_ids.map((value: string) => new Types.ObjectId(extractId(value))) : [],
        subjects: Array.isArray(data.subjects) ? data.subjects : [],
        grade_thresholds: data.grade_thresholds ?? {},
        fee_structure: data.fee_structure ?? undefined
      });
      const saved = await newClass.save();
      return saved;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ControlledError(
          "DUPLICATE_CLASS",
          "This class already exists for the selected academic year.",
          409,
          error?.keyValue
        );
      }
      throw error;
    }
  });
}

export async function updateClass(ctx: RequestContext, id: string, data: any): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });
    const patch: any = { ...data };
    const academicYearId = extractId(data.academic_year_id).trim();
    const teacherIds = Array.isArray(data.teacher_ids)
      ? data.teacher_ids.map((value: any) => extractId(value).trim()).filter(Boolean)
      : [];
    const subjectIds = Array.isArray(data.subject_ids)
      ? data.subject_ids.map((value: any) => extractId(value).trim()).filter(Boolean)
      : [];

    if (academicYearId) {
      patch.academic_year_id = academicYearId;
    } else {
      delete patch.academic_year_id;
    }
    delete patch.teacher_ids;
    delete patch.subject_ids;

    if (data.class_teacher_id) {
      patch.class_teacher_id = new Types.ObjectId(extractId(data.class_teacher_id));
      patch.teacher_ids = teacherIds.length > 0
        ? teacherIds.map((value: string) => new Types.ObjectId(value))
        : [patch.class_teacher_id];
    } else if (teacherIds.length > 0) {
      patch.teacher_ids = teacherIds.map((value: string) => new Types.ObjectId(value));
    }
    if (subjectIds.length > 0) {
      patch.subject_ids = subjectIds.map((value: string) => new Types.ObjectId(value));
    }
    const updated = await ClassModel.findOneAndUpdate(filter, patch, { new: true, runValidators: true });
    if (!updated) throw new Error("Class not found");
    return updated;
  });
}

export async function deleteClass(ctx: RequestContext, id: string): Promise<ServiceResult<null>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    Object.assign(filter, { _id: new Types.ObjectId(id) });

    const [studentCount, feeCount, examCount, resultCount] = await Promise.all([
      StudentModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)),
      FeeModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)).catch(() => 0),
      ExamModel.countDocuments(tenantFilter(ctx, { class_id: id } as any)),
      ResultModel.countDocuments(tenantFilter(ctx, { class_id: id } as any))
    ]);

    if (studentCount > 0) throw new ControlledError("CLASS_HAS_STUDENTS", "Cannot delete a class with enrolled students.", 400);
    if (feeCount > 0) throw new ControlledError("CLASS_HAS_FEES", "Cannot delete a class with generated fees.", 400);
    if (examCount > 0 || resultCount > 0) {
      throw new ControlledError("CLASS_HAS_EXAMS", "Cannot delete a class with exams or results.", 400);
    }

    const deleted = await ClassModel.findOneAndDelete(filter);
    if (!deleted) throw new Error("Class not found");

    await Promise.all([
      AttendanceModel.deleteMany({ school_id: ctx.school_id, class_id: id })
    ]);

    return null;
  });
}
