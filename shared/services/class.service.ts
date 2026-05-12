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
  const source = Array.isArray(classRow.subjects) && classRow.subjects.length > 0
    ? classRow.subjects
    : [];

  return source.map((subject: any) => {
    return {
      name: subject.name || "",
      total_marks: Number(subject.total_marks || 100),
      passing_marks: Number(subject.passing_marks || 33),
      teacher_id: extractId(subject.teacher_id),
      starts_at: subject.starts_at || "",
      ends_at: subject.ends_at || "",
      day_of_week: Number(subject.day_of_week || 1),
      timetable: subject.timetable || ""
    };
  });
}

function toClassSummary(classRow: any) {
  const classTeacher = classRow.class_teacher_id;

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
    teacher_names: (classRow.teacher_ids ?? []).map((t: any) => t.first_name ? `${t.first_name} ${t.last_name || ""}`.trim() : "Teacher"),
    subjects: normalizeSubjects(classRow),
    room_number: classRow.room_number ?? "",
    description: classRow.description ?? "",
    status: classRow.status ?? "active",
    fee_status: Number(classRow.fee_status || 0)
  };
}

export async function listClasses(ctx: RequestContext, query: any = {}): Promise<ServiceResult<any>> {
  return serviceTry(async () => {
    const filter = tenantFilter(ctx);
    
    let academicYearId = query.academic_year_id;
    if (!academicYearId || academicYearId === "undefined") {
      const { resolveAcademicYearId } = await import("./_academic-year-filter");
      academicYearId = await resolveAcademicYearId(ctx);
    }

    if (academicYearId) {
      filter.academic_year_id = new Types.ObjectId(academicYearId);
    }
    
    // Pagination params
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 100); // Higher default for classes if no limit provided
    const skip = (page - 1) * limit;

    // Clean query from pagination and academic year params for model filtering
    const { academic_year_id, page: _p, limit: _l, ...restQuery } = query;
    Object.assign(filter, restQuery);

    if (ctx.role === "teacher") {
      const { resolveTeacherClassIds } = await import("./teacher.service");
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      filter._id = { $in: teacherClassIds };
    }

    const [rows, total, studentCounts, feeStats] = await Promise.all([
      ClassModel.find(filter)
        .populate("academic_year_id", "year start_date end_date is_active")
        .populate("teacher_ids", "first_name last_name phone")
        .populate("class_teacher_id", "first_name last_name phone")
        .populate("subject_ids", "name code")
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ClassModel.countDocuments(filter),
      StudentModel.aggregate([
        { $match: tenantFilter(ctx) },
        { $group: { _id: "$class_id", count: { $sum: 1 } } }
      ]),
      FeeModel.aggregate([
        { $match: tenantFilter(ctx) },
        {
          $group: {
            _id: "$class_id",
            total_amount: { $sum: "$amount" },
            paid_amount: { $sum: "$paid_amount" }
          }
        }
      ])
    ]);

    const countMap = new Map(studentCounts.map((item) => [String(item._id), Number(item.count || 0)]));
    const feeMap = new Map(feeStats.map((item) => {
        const percentage = item.total_amount > 0 ? Math.round((item.paid_amount / item.total_amount) * 100) : 0;
        return [String(item._id), percentage];
    }));

    const items = rows.map((row: any) => {
      const enrolled_students = countMap.get(String(row._id)) ?? 0;
      const fee_status = feeMap.get(String(row._id)) ?? 0;
      
      return {
        ...toClassSummary({ ...row, enrolled_students, fee_status }),
        academic_year: row.academic_year_id?.year ?? row.academic_year ?? "",
        class_teacher: row.class_teacher_id
          ? {
            id: String(row.class_teacher_id._id ?? row.class_teacher_id),
            name: `${row.class_teacher_id.first_name || ""} ${row.class_teacher_id.last_name || ""}`.trim(),
            phone: row.class_teacher_id.phone ?? ""
          }
          : null,
        subjects: normalizeSubjects(row)
      };
    });

    // Return paginated structure if page/limit were provided, otherwise just data for backward compatibility
    if (query.page || query.limit) {
      return {
        data: items,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    }

    return items;
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
