import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { ExamModel } from "../models/exam.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { ExamCreateInput, examCreateSchema } from "../validation/exam.schema";
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

export async function listExams(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "exams", "view");

    const rows = await ExamModel.find(tenantFilter(ctx))
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