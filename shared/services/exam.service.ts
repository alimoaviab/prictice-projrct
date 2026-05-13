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
  filter: { academic_year_id?: string; page?: string | number; limit?: string | number; class_id?: string; status?: string } = {}
): Promise<ServiceResult<unknown[] | { items: unknown[]; total: number; page: number; limit: number; pages: number }>> {
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
      const teacherId = new Types.ObjectId(ctx.user_id);
      
      // Find all classes where this teacher is either the class teacher 
      // OR assigned to a specific subject
      const assignedClasses = await ClassModel.find(tenantFilter(ctx, {
        $or: [
          { class_teacher_id: teacherId },
          { "subjects.teacher_id": teacherId }
        ]
      })).select("_id name subjects class_teacher_id").lean();

      const teacherConditions: any[] = [];

      assignedClasses.forEach(cls => {
        if (String(cls.class_teacher_id) === ctx.user_id) {
          // If class teacher, can see all exams for this class
          teacherConditions.push({ class_id: cls._id });
        } else {
          // Otherwise, only exams for subjects they teach
          const taughtSubjects = cls.subjects
            .filter((s: any) => String(s.teacher_id) === ctx.user_id)
            .map((s: any) => s.name);
          
          if (taughtSubjects.length > 0) {
            teacherConditions.push({ 
              class_id: cls._id, 
              subject: { $in: taughtSubjects } 
            });
          }
        }
      });

      if (teacherConditions.length === 0) {
        return []; // No assignments
      }
      query.$or = teacherConditions;
    }

    const rows = await ExamModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "results",
          localField: "_id",
          foreignField: "exam_id",
          as: "results"
        }
      },
      {
        $lookup: {
          from: "classes",
          localField: "class_id",
          foreignField: "_id",
          as: "class_info"
        }
      },
      {
        $project: {
          school_id: 1,
          class_id: 1,
          subject: 1,
          title: 1,
          starts_at: 1,
          max_marks: 1,
          status: 1,
          description: 1,
          results_count: { $size: "$results" },
          class_name: { $arrayElemAt: ["$class_info.name", 0] }
        }
      },
      { $sort: { starts_at: -1 } }
    ]);

    const items = rows.map(row => ({
      ...row,
      _id: String(row._id),
      class_id: String(row.class_id),
      starts_at: row.starts_at instanceof Date ? row.starts_at.toISOString().split("T")[0] : String(row.starts_at)
    }));

    const { parsePagination, buildPaginatedResponse } = await import("../db/pagination");
    const pagination = parsePagination(filter, { defaultLimit: 25, maxLimit: 200 });
    if (!pagination.enabled) return items;
    const total = items.length;
    const sliced = items.slice(pagination.skip, pagination.skip + pagination.limit);
    return buildPaginatedResponse(sliced, total, pagination);
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