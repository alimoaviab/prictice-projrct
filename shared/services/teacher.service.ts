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
import { TeacherCreateInput, teacherCreateSchema } from "../validation/teacher.schema";
import { writeAuditLog } from "./audit.service";

async function nextEmployeeNumber(schoolId: string) {
  const count = await TeacherModel.countDocuments({ school_id: schoolId });
  return `TCH-${String(count + 1).padStart(4, "0")}`;
}

export async function listTeachers(ctx: RequestContext): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "teachers", "view");

    const teachers = await TeacherModel.find(tenantFilter(ctx)).sort({ first_name: 1, last_name: 1 }).lean();
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

    const created = await TeacherModel.create({
      school_id: ctx.school_id,
      user_id: user._id,
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
