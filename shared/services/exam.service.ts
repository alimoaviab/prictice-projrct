import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { ExamModel } from "../models/exam.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { ExamCreateInput, ExamUpdateInput, examCreateSchema, examUpdateSchema } from "../validation/exam.schema";
import { resolveClassIdsForAcademyCare } from "./_academy-care-filter";
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
  filter: { academy_care_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    const classIds = await resolveClassIdsForAcademyCare(ctx, filter.academy_care_id);

    const rows = await ExamModel.find(tenantFilter(ctx, { class_id: { $in: classIds } }))
      .populate("class_id", "name")
      .sort({ starts_at: -1 })
      .lean();

    return rows.map(mapExamRecord);
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
      class_id: new Types.ObjectId(parsed.class_id),
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