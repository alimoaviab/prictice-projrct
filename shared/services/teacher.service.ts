// @ts-nocheck
import { Types } from "mongoose";
import { assertPermission } from "../auth/rbac";
import { hashPassword } from "../auth/password";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ClassModel } from "../models/class.model";
import { TeacherModel } from "../models/teacher.model";
import { UserModel } from "../models/user.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { TeacherCreateInput, TeacherUpdateInput, teacherCreateSchema, teacherUpdateSchema } from "../validation/teacher.schema";
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";
import { writeAuditLog } from "./audit.service";

async function nextEmployeeNumber(schoolId: string) {
  const count = await TeacherModel.countDocuments({ school_id: schoolId });
  return `TCH-${String(count + 1).padStart(4, "0")}`;
}

export async function resolveTeacherClassIds(ctx: RequestContext): Promise<Types.ObjectId[]> {
  const teacher = (await TeacherModel.findOne(
    tenantFilter(ctx, { user_id: new Types.ObjectId(ctx.user_id) })
  )
    .select("class_ids")
    .lean()) as { class_ids?: unknown[] } | null;

  if (!teacher?.class_ids?.length) {
    return [];
  }

  return teacher.class_ids.map((id) => new Types.ObjectId(String(id)));
}

export async function listTeachers(
  ctx: RequestContext,
  filter: { academic_year_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "teachers", "view");

    // Resolve Academic Year strictly
    let academicYearId = filter.academic_year_id;
    if (!academicYearId || academicYearId === "undefined") {
      const { resolveAcademicYearId } = await import("./_academic-year-filter");
      academicYearId = await resolveAcademicYearId(ctx);
    }

    const query = tenantFilter(ctx, {
      ...(academicYearId ? { academic_year_id: new Types.ObjectId(academicYearId) } : {})
    });

    const teachers = await TeacherModel.find(query)
      .sort({ first_name: 1, last_name: 1 })
      .lean();

    const userIds = teachers.map((teacher) => teacher.user_id).filter(Boolean);
    const users = await UserModel.find({ _id: { $in: userIds } }).lean();
    const usersById = new Map(users.map((user) => [String(user._id), user]));

    return teachers.map((teacher) => {
      const user = teacher.user_id ? usersById.get(String(teacher.user_id)) : undefined;
      return {
        ...teacher,
        _id: String(teacher._id),
        email: user?.email ?? "",
        phone: teacher.phone ?? user?.profile?.phone ?? "",
        qualification: teacher.qualification ?? "",
        class_ids: (teacher.class_ids ?? []).map((value: unknown) => String(value))
      };
    });
  });
}

export async function createTeacher(
  ctx: RequestContext,
  input: TeacherCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "teachers", "create");

    const parsed = teacherCreateSchema.parse(input);
    const existingUser = await UserModel.findOne({
      school_id: ctx.school_id,
      email: parsed.email.toLowerCase()
    }).lean();

    if (existingUser) {
      throw new Error("A user with this email already exists.");
    }

    const user = await UserModel.create({
      school_id: ctx.school_id,
      email: parsed.email.toLowerCase(),
      password_hash: hashPassword(parsed.password),
      role: "teacher",
      permissions: [],
      profile: {
        first_name: parsed.first_name,
        last_name: parsed.last_name ?? "",
        phone: parsed.phone
      },
      status: "active"
    });

    // Resolve Academic Year
    let academicYearId = ctx.active_academic_year_id;
    if (!academicYearId) {
      const { AcademicYearModel } = await import("../models/academic-year.model");
      const activeYear = await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true }))
        .select("_id")
        .lean();
      academicYearId = activeYear?._id ? String(activeYear._id) : undefined;
    }

    const created = await TeacherModel.create({
      school_id: ctx.school_id,
      academic_year_id: academicYearId ? new Types.ObjectId(academicYearId) : undefined,
      user_id: user._id,
      email: parsed.email.toLowerCase(),
      employee_no: await nextEmployeeNumber(ctx.school_id),
      first_name: parsed.first_name,
      last_name: parsed.last_name ?? "",
      phone: parsed.phone,
      qualification: parsed.qualification ?? "",
      subjects: parsed.subjects,
      class_ids: parsed.class_ids.map((value) => new Types.ObjectId(value))
    });

    if (parsed.class_ids.length > 0) {
      await ClassModel.updateMany(
        tenantFilter(ctx, { _id: { $in: parsed.class_ids } }),
        { $addToSet: { teacher_ids: created._id } }
      );
    }

    const teacher = {
      ...created.toObject(),
      _id: String(created._id),
      email: user.email
    };

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "teacher",
      entity_id: String(created._id),
      after: teacher
    });

    return teacher;
  });
}

export async function updateTeacher(
  ctx: RequestContext,
  id: string,
  input: TeacherUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "teachers", "update");

    const parsed = teacherUpdateSchema.parse(input);
    const existing = (await TeacherModel.findOne(tenantFilter(ctx, { _id: id })).lean()) as {
      user_id?: unknown;
    } | null;
    if (!existing) {
      throw new Error("Teacher not found.");
    }

    const patch = { ...parsed } as any;
    if (parsed.class_ids) {
      patch.class_ids = parsed.class_ids.map((value) => new Types.ObjectId(value));
    }

    const updated = await TeacherModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    // Update associated user if needed
    if (existing.user_id && (parsed.first_name || parsed.last_name || parsed.phone || parsed.password)) {
      const userPatch: any = {};
      if (parsed.first_name) userPatch["profile.first_name"] = parsed.first_name;
      if (parsed.last_name) userPatch["profile.last_name"] = parsed.last_name;
      if (parsed.phone) userPatch["profile.phone"] = parsed.phone;
      if (parsed.password) userPatch["password_hash"] = hashPassword(parsed.password);

      if (Object.keys(userPatch).length > 0) {
        await UserModel.updateOne(
          { _id: existing.user_id },
          { $set: userPatch }
        );
      }
    }

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "teacher",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

export async function deleteTeacher(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "teachers", "delete");

    const existing = (await TeacherModel.findOne(tenantFilter(ctx, { _id: id })).lean()) as {
      class_ids?: unknown[];
      user_id?: unknown;
    } | null;
    if (!existing) {
      throw new Error("Teacher not found.");
    }

    // Remove teacher from classes
    if (existing.class_ids && existing.class_ids.length > 0) {
      await ClassModel.updateMany(
        tenantFilter(ctx, { _id: { $in: existing.class_ids } }),
        { $pull: { teacher_ids: new Types.ObjectId(id) } }
      );
    }

    // Delete associated user
    if (existing.user_id) {
      await UserModel.deleteOne({ _id: existing.user_id });
    }

    await TeacherModel.findOneAndDelete(tenantFilter(ctx, { _id: id }));

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "teacher",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
