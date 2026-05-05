// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { HomeworkModel } from "../models/homework.model";
import { TeacherModel } from "../models/teacher.model";
import { SubjectModel } from "../models/subject.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { HomeworkCreateInput, HomeworkUpdateInput, homeworkCreateSchema, homeworkUpdateSchema } from "../validation/homework.schema";
import { resolveClassIdsForAcademyCare } from "./_academy-care-filter";
import { writeAuditLog } from "./audit.service";

export async function getHomework(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "homework", "view");

    const row = await HomeworkModel.findOne(tenantFilter(ctx, { _id: id }))
      .populate("class_id", "name")
      .populate("teacher_id", "first_name last_name")
      .populate({ path: "subject_id", select: "name", strictPopulate: false })
      .lean();

    if (!row) throw new Error("Homework not found.");

    return {
      ...row,
      _id: String(row._id),
      due_at: row.due_at instanceof Date ? row.due_at.toISOString().split("T")[0] : row.due_at
    };
  });
}

export async function listHomework(
  ctx: RequestContext,
  filter: { academy_care_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "homework", "view");

    const classIds = await resolveClassIdsForAcademyCare(ctx, filter.academy_care_id);

    const rows = await HomeworkModel.find(tenantFilter(ctx, { class_id: { $in: classIds } }))
      .populate("class_id", "name")
      .populate("teacher_id", "employee_no first_name last_name")
      .populate({ path: "subject_id", select: "name", strictPopulate: false })
      .sort({ due_at: 1, createdAt: -1 })
      .lean();

    return rows.map((row) => {
      const classroom = row.class_id as { _id?: unknown; name?: string };
      const teacher = row.teacher_id as {
        _id?: unknown;
        employee_no?: string;
        first_name?: string;
        last_name?: string;
      };
      const subject = row.subject_id as { _id?: unknown; name?: string };

      return {
        ...row,
        _id: String(row._id),
        class_id: classroom?._id ? String(classroom._id) : String(row.class_id),
        class_name: classroom?.name ?? "",
        teacher_id: teacher?._id ? String(teacher._id) : String(row.teacher_id),
        teacher_name: `${teacher?.first_name ?? ""} ${teacher?.last_name ?? ""}`.trim(),
        teacher_employee_no: teacher?.employee_no ?? "",
        subject_id: subject?._id ? String(subject._id) : (row.subject_id ? String(row.subject_id) : ""),
        subject_name: subject?.name ?? (row.subject ?? ""),
        due_at: row.due_at instanceof Date ? row.due_at.toISOString().split("T")[0] : row.due_at
      };
    });
  });
}

export async function createHomework(
  ctx: RequestContext,
  input: HomeworkCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "homework", "create");

    const parsed = homeworkCreateSchema.parse(input);
    const dueAt = new Date(parsed.due_at);
    dueAt.setHours(23, 59, 0, 0);

    const classroom = await ClassModel.findOne(
      tenantFilter(ctx, { _id: parsed.class_id })
    ).lean();
    if (!classroom) {
      throw new Error("Selected class was not found.");
    }

    const teacher = await TeacherModel.findOne(
      tenantFilter(ctx, { _id: parsed.teacher_id })
    ).lean();
    if (!teacher) {
      throw new Error("Selected teacher was not found.");
    }

    // Validate subject exists
    const subject = await SubjectModel.findOne(
      tenantFilter(ctx, { _id: parsed.subject_id })
    ).lean();
    if (!subject) {
      throw new Error("Selected subject was not found.");
    }

    const created = await HomeworkModel.create({
      school_id: ctx.school_id,
      class_id: new Types.ObjectId(parsed.class_id),
      teacher_id: new Types.ObjectId(parsed.teacher_id),
      subject_id: new Types.ObjectId(parsed.subject_id),
      subject: subject.name, // Set subject name for backward compatibility
      title: parsed.title,
      instructions: parsed.instructions ?? "",
      due_at: dueAt,
      status: parsed.status,
      submissions: []
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "homework",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

export async function updateHomework(
  ctx: RequestContext,
  id: string,
  input: HomeworkUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "homework", "update");

    const parsed = homeworkUpdateSchema.parse(input);
    const existing = await HomeworkModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Homework not found.");
    }

    if (parsed.class_id) {
      const classroom = await ClassModel.findOne(tenantFilter(ctx, { _id: parsed.class_id })).lean();
      if (!classroom) {
        throw new Error("Selected class was not found.");
      }
    }

    if (parsed.teacher_id) {
      const teacher = await TeacherModel.findOne(tenantFilter(ctx, { _id: parsed.teacher_id })).lean();
      if (!teacher) {
        throw new Error("Selected teacher was not found.");
      }
    }

    if (parsed.subject_id) {
      const subject = await SubjectModel.findOne(tenantFilter(ctx, { _id: parsed.subject_id })).lean();
      if (!subject) {
        throw new Error("Selected subject was not found.");
      }
    }

    const patch = { ...parsed } as any;
    if (parsed.class_id) {
      patch.class_id = new Types.ObjectId(parsed.class_id);
    }
    if (parsed.teacher_id) {
      patch.teacher_id = new Types.ObjectId(parsed.teacher_id);
    }
    if (parsed.subject_id) {
      patch.subject_id = new Types.ObjectId(parsed.subject_id);
      const subject = await SubjectModel.findOne(tenantFilter(ctx, { _id: parsed.subject_id })).lean();
      patch.subject = subject?.name; // Update subject name for backward compatibility
    }
    if (parsed.due_at) {
      const dueAt = new Date(parsed.due_at);
      dueAt.setHours(23, 59, 0, 0);
      patch.due_at = dueAt;
    }

    const updated = await HomeworkModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "homework",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

export async function deleteHomework(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "homework", "delete");

    const existing = await HomeworkModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Homework not found.");
    }

    await HomeworkModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "homework",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
