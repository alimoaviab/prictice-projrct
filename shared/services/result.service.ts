import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { ExamModel } from "../models/exam.model";
import { ResultModel } from "../models/result.model";
import { StudentModel } from "../models/student.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { ResultCreateInput, resultCreateSchema } from "../validation/result.schema";
import { writeAuditLog } from "./audit.service";

type ResultRecord = {
  _id: unknown;
  school_id: string;
  exam_id: string | { _id?: unknown; title?: string; subject?: string; class_id?: unknown; max_marks?: number };
  student_id: string | { _id?: unknown; first_name?: string; last_name?: string; admission_no?: string };
  class_id: string | { _id?: unknown; name?: string };
  obtained_marks: number;
  grade?: string;
  remarks?: string;
  graded_at: Date;
};

function mapResultRecord(row: Record<string, any>) {
  return {
    ...row,
    _id: String(row._id),
    exam_id: String(row.exam_id?._id ?? row.exam_id),
    exam_title: typeof row.exam_id === "object" && row.exam_id ? row.exam_id.title ?? "" : "",
    exam_subject: typeof row.exam_id === "object" && row.exam_id ? row.exam_id.subject ?? "" : "",
    max_marks: typeof row.exam_id === "object" && row.exam_id ? Number(row.exam_id.max_marks ?? 0) : 0,
    student_id: String(row.student_id?._id ?? row.student_id),
    student_name:
      typeof row.student_id === "object" && row.student_id
        ? `${String(row.student_id.first_name ?? "")} ${String(row.student_id.last_name ?? "")}`.trim()
        : "",
    admission_no:
      typeof row.student_id === "object" && row.student_id ? String(row.student_id.admission_no ?? "") : "",
    class_id: String(row.class_id?._id ?? row.class_id),
    class_name: typeof row.class_id === "object" && row.class_id ? String(row.class_id.name ?? "") : "",
    graded_at: row.graded_at instanceof Date ? row.graded_at.toISOString().split("T")[0] : String(row.graded_at)
  };
}

export async function listResults(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "results", "view");

    const rows = await ResultModel.find(tenantFilter(ctx))
      .populate("exam_id", "title subject class_id max_marks")
      .populate("student_id", "first_name last_name admission_no class_id")
      .populate("class_id", "name")
      .sort({ graded_at: -1 })
      .lean();

    return rows.map(mapResultRecord);
  });
}

export async function saveResult(ctx: RequestContext, input: ResultCreateInput): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "results", "create");

    const parsed = resultCreateSchema.parse(input);
    const exam = (await ExamModel.findOne(tenantFilter(ctx, { _id: parsed.exam_id })).lean()) as
      | { _id: unknown; class_id: unknown; max_marks: number; title?: string }
      | null;
    if (!exam) {
      throw new Error("Selected exam was not found.");
    }

    const student = (await StudentModel.findOne(tenantFilter(ctx, { _id: parsed.student_id })).lean()) as
      | { _id: unknown; class_id: unknown; first_name?: string; last_name?: string }
      | null;
    if (!student) {
      throw new Error("Selected student was not found.");
    }

    if (String(student.class_id) !== String(exam.class_id)) {
      throw new Error("Selected student does not belong to the exam class.");
    }

    if (parsed.obtained_marks > Number(exam.max_marks ?? 0)) {
      throw new Error("Obtained marks cannot exceed exam total marks.");
    }

    const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: exam.class_id })).lean();
    if (!classroom) {
      throw new Error("Exam class was not found.");
    }

    const existing = (await ResultModel.findOne(
      tenantFilter(ctx, {
        exam_id: new Types.ObjectId(parsed.exam_id),
        student_id: new Types.ObjectId(parsed.student_id)
      })
    ).lean()) as ResultRecord | null;

    const patch = {
      exam_id: new Types.ObjectId(parsed.exam_id),
      student_id: new Types.ObjectId(parsed.student_id),
      class_id: new Types.ObjectId(String(exam.class_id)),
      obtained_marks: parsed.obtained_marks,
      grade: parsed.grade ?? "",
      remarks: parsed.remarks ?? "",
      graded_at: new Date()
    };

    const saved = (await ResultModel.findOneAndUpdate(
      tenantFilter(ctx, {
        exam_id: new Types.ObjectId(parsed.exam_id),
        student_id: new Types.ObjectId(parsed.student_id)
      }),
      { $set: patch, $setOnInsert: { school_id: ctx.school_id } },
      { new: true, upsert: true, runValidators: true }
    ).lean()) as ResultRecord | null;

    await writeAuditLog(ctx, {
      action: existing ? "update" : "create",
      entity_type: "result",
      entity_id: String(saved?._id ?? existing?._id ?? parsed.exam_id),
      before: existing,
      after: saved,
      metadata: { scope: "results" }
    });

    return mapResultRecord(saved ?? patch);
  });
}