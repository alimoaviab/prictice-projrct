import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { ExamModel } from "../models/exam.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { ExamCreateInput, ExamUpdateInput, examCreateSchema, examUpdateSchema } from "../validation/exam.schema";
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";
import { writeAuditLog } from "./audit.service";

type ExamRecord = {
  _id: unknown;
  school_id: string;
  class_id: string | { _id?: unknown; name?: string };
  class_name?: string;
  subject: string;
  title: string;
  starts_at: Date;
  max_marks: number;
  status: "scheduled" | "completed" | "cancelled";
  description?: string;
};

function mapExamRecord(row: Record<string, any>) {
  return {
    ...row,
    _id: String(row._id),
    class_id: String(row.class_id?._id ?? row.class_id),
    class_name: typeof row.class_id === "object" && row.class_id && "name" in row.class_id ? row.class_id.name : "",
    starts_at: row.starts_at instanceof Date ? row.starts_at.toISOString().split("T")[0] : String(row.starts_at)
  };
}

export async function listExams(
  ctx: RequestContext,
  filter: { academic_year_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    // Resolve Academic Year strictly
    let academicYearId = filter.academic_year_id;
    if (!academicYearId || academicYearId === "undefined") {
      const { resolveAcademicYearId } = await import("./_academic-year-filter");
      academicYearId = await resolveAcademicYearId(ctx);
    }

    const query = tenantFilter(ctx, {
      ...(academicYearId ? { academic_year_id: new Types.ObjectId(academicYearId) } : {})
    });
    
    if (ctx.role === "teacher") {
      const { resolveTeacherClassIds } = await import("./teacher.service");
      const teacherClassIds = await resolveTeacherClassIds(ctx);
      query.class_id = { $in: teacherClassIds };
    }

    const rows = await ExamModel.find(query)
      .populate("class_id", "name")
      .sort({ starts_at: -1 })
      .lean();

    return rows.map(mapExamRecord);
  });
}

export async function getExam(ctx: RequestContext, id: string): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    const row = await ExamModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("class_id", "name")
      .lean();

    if (!row) throw new Error("Exam not found");
    return mapExamRecord(row);
  });
}

export async function createExam(ctx: RequestContext, input: ExamCreateInput): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "create");

    const parsed = examCreateSchema.parse(input);
    const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
    if (!classroom) {
      throw new Error("Selected class was not found.");
    }

    const created = await ExamModel.create({
      school_id: ctx.school_id,
      academic_year_id: ctx.active_academic_year_id ? new Types.ObjectId(ctx.active_academic_year_id) : undefined,
      class_id: new Types.ObjectId(parsed.class_id),
      teacher_id: ctx.role === "teacher" ? new Types.ObjectId(ctx.user_id) : undefined,
      subject: parsed.subject,
      title: parsed.title,
      starts_at: parsed.starts_at,
      max_marks: parsed.max_marks,
      status: parsed.status ?? "scheduled",
      description: parsed.description ?? ""
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "exam",
      entity_id: String(created._id),
      after: created.toObject(),
      metadata: { scope: "exams" }
    });

    return mapExamRecord(created.toObject());
  });
}

export async function updateExam(
  ctx: RequestContext,
  id: string,
  input: ExamUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "update");

    const parsed = examUpdateSchema.parse(input);
    const existing = await ExamModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Exam not found.");
    }

    if (parsed.class_id) {
      const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
      if (!classroom) {
        throw new Error("Selected class was not found.");
      }
    }

    const patch = { ...parsed } as any;
    if (parsed.class_id) {
      patch.class_id = new Types.ObjectId(parsed.class_id);
    }

    const updated = await ExamModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "exam",
      entity_id: id,
      before: existing,
      after: updated
    });

    return mapExamRecord(updated!);
  });
}

export async function deleteExam(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "delete");

    const existing = await ExamModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Exam not found.");
    }

    await ExamModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "exam",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}