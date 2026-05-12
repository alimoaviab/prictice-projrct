import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ResultModel } from "../models/result.model";
import { ExamModel } from "../models/exam.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { resolveTeacherClassIds } from "./teacher.service";
import { writeAuditLog } from "./audit.service";

export async function listResults(
  ctx: RequestContext,
  filter: { academic_year_id?: string; exam_id?: string; student_id?: string }
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    const query = tenantFilter(ctx);

    if (ctx.role === "teacher") {
        const teacherClassIds = await resolveTeacherClassIds(ctx);
        query.class_id = { $in: teacherClassIds };
    }

    if (filter.academic_year_id) {
      query.academic_year_id = new Types.ObjectId(filter.academic_year_id);
    }
    if (filter.exam_id) {
      query.exam_id = new Types.ObjectId(filter.exam_id);
    }
    if (filter.student_id) {
      query.student_id = new Types.ObjectId(filter.student_id);
    }

    const rows = await ResultModel.find(query)
      .populate("student_id", "first_name last_name admission_no")
      .populate("exam_id", "title subject max_marks")
      .populate("class_id", "name")
      .sort({ graded_at: -1 })
      .lean();

    return rows.map(row => ({
      ...row,
      _id: String(row._id),
      student_id: String((row.student_id as any)?._id || row.student_id),
      student_name: `${(row.student_id as any)?.first_name || ""} ${(row.student_id as any)?.last_name || ""}`.trim(),
      admission_no: (row.student_id as any)?.admission_no || "",
      exam_id: String((row.exam_id as any)?._id || row.exam_id),
      exam_title: (row.exam_id as any)?.title || "Unknown Exam",
      exam_subject: (row.exam_id as any)?.subject || "N/A",
      max_marks: (row.exam_id as any)?.max_marks || 0,
      class_id: String((row.class_id as any)?._id || row.class_id),
      class_name: (row.class_id as any)?.name || "N/A",
      grade: calculateGrade(row.obtained_marks, (row.exam_id as any)?.max_marks || 100)
    }));
  });
}

function calculateGrade(obtained: number, max: number): string {
  const percentage = (obtained / max) * 100;
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

export async function saveResult(
  ctx: RequestContext,
  input: { exam_id: string; student_id: string; obtained_marks: number; remarks?: string }
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "update");

    const exam = await ExamModel.findOne(tenantFilter(ctx, { _id: input.exam_id })).lean() as any;
    if (!exam) throw new Error("Exam not found");

    const updated = await ResultModel.findOneAndUpdate(
      tenantFilter(ctx, { 
        exam_id: new Types.ObjectId(input.exam_id),
        student_id: new Types.ObjectId(input.student_id)
      }),
      {
        $set: {
          school_id: ctx.school_id,
          academic_year_id: exam.academic_year_id,
          exam_id: new Types.ObjectId(input.exam_id),
          class_id: exam.class_id,
          student_id: new Types.ObjectId(input.student_id),
          obtained_marks: input.obtained_marks,
          remarks: input.remarks || "",
          graded_at: new Date()
        }
      },
      { upsert: true, new: true }
    ).lean();

    return updated;
  });
}

export async function listExamResults(
  ctx: RequestContext,
  examId: string
): Promise<ServiceResult<unknown[]>> {
  return listResults(ctx, { exam_id: examId });
}

export async function saveExamResults(
  ctx: RequestContext,
  examId: string,
  results: Array<{ student_id: string; obtained_marks: number; remarks?: string }>
): Promise<ServiceResult<{ saved: number }>> {
  return serviceTry(async () => {
    let saved = 0;
    for (const res of results) {
      await saveResult(ctx, { ...res, exam_id: examId });
      saved++;
    }

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "exam",
      entity_id: examId,
      metadata: { count: saved }
    });

    return { saved };
  });
}