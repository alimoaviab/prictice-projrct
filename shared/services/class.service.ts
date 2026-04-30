import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { AcademicYearModel } from "../models/academic-year.model";
import { ClassModel } from "../models/class.model";
import { TeacherModel } from "../models/teacher.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { ClassCreateInput, classCreateSchema } from "../validation/class.schema";
import { writeAuditLog } from "./audit.service";

type AcademyCareRef = {
  year: string;
};

export async function listClasses(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "classes", "view");

    const rows = await ClassModel.find(tenantFilter(ctx))
      .populate("academy_care_id", "year")
      .populate("teacher_ids", "first_name last_name employee_no")
      .sort({ name: 1 })
      .lean();

    return rows.map((row) => ({
      ...row,
      _id: String(row._id),
      academy_care_id: String(row.academy_care_id?._id ?? row.academy_care_id),
      academy_care_year:
        typeof row.academy_care_id === "object" && row.academy_care_id && "year" in row.academy_care_id
          ? row.academy_care_id.year
          : row.academic_year,
      teacher_ids: (row.teacher_ids ?? []).map((teacher: unknown) =>
        typeof teacher === "object" && teacher && "_id" in teacher
          ? String((teacher as { _id: unknown })._id)
          : String(teacher)
      ),
      teacher_names: (row.teacher_ids ?? []).map((teacher: unknown) =>
        typeof teacher === "object" && teacher
          ? `${String((teacher as { first_name?: unknown }).first_name ?? "")} ${String(
              (teacher as { last_name?: unknown }).last_name ?? ""
            )}`.trim()
          : ""
      )
    }));
  });
}

export async function createClass(
  ctx: RequestContext,
  input: ClassCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "classes", "create");

    const parsed = classCreateSchema.parse(input);
    const academyCare = (await AcademicYearModel.findOne(
      tenantFilter(ctx, { _id: parsed.academy_care_id })
    ).lean()) as unknown as AcademyCareRef | null;

    if (!academyCare) {
      throw new Error("Linked academy care record was not found.");
    }

    const subjects = parsed.subjects.map((subject) => subject.trim()).filter(Boolean);
    const teacherIds = parsed.teacher_ids.map((value) => new Types.ObjectId(value));
    const created = await ClassModel.create({
      school_id: ctx.school_id,
      name: parsed.name,
      academy_care_id: new Types.ObjectId(parsed.academy_care_id),
      academic_year: academyCare.year,
      subjects,
      teacher_ids: teacherIds,
      room_number: parsed.room_number ?? "",
      description: parsed.description ?? ""
    });

    if (teacherIds.length > 0) {
      await TeacherModel.updateMany(
        tenantFilter(ctx, { _id: { $in: teacherIds } }),
        { $addToSet: { class_ids: created._id } }
      );
    }

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "class",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}
