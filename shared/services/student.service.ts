import { Types } from "mongoose";
import { hashPassword } from "../auth/password";
import { assertPermission } from "../auth/rbac";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { StudentModel } from "../models/student.model";
import { UserModel } from "../models/user.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import {
  StudentCreateInput,
  StudentUpdateInput,
  studentCreateSchema,
  studentUpdateSchema
} from "../validation/student.schema";
import { resolveClassIdsForAcademyCare } from "./_academy-care-filter";
import { writeAuditLog } from "./audit.service";

async function nextAdmissionNumber(schoolId: string): Promise<string> {
  let sequence = (await StudentModel.countDocuments({ school_id: schoolId })) + 1;
  while (true) {
    const admissionNo = `STU-${String(sequence).padStart(5, "0")}`;
    const exists = await StudentModel.exists({ school_id: schoolId, admission_no: admissionNo });
    if (!exists) {
      return admissionNo;
    }
    sequence += 1;
  }
}

export async function listStudents(
  ctx: RequestContext,
  filter: { class_id?: string; status?: string; academy_care_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "view");

    const classIds = await resolveClassIdsForAcademyCare(ctx, filter.academy_care_id);
    const query = tenantFilter(ctx, {
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.class_id ? { class_id: new Types.ObjectId(filter.class_id) } : {}),
      class_id: filter.class_id ? new Types.ObjectId(filter.class_id) : { $in: classIds }
    });

    const filtered = await StudentModel.find(query).sort({ last_name: 1, first_name: 1 }).lean();

    if ((filter.academy_care_id || classIds.length > 0) && filtered.length === 0) {
      return StudentModel.find(tenantFilter(ctx, {
        ...(filter.status ? { status: filter.status } : {})
      }))
        .sort({ last_name: 1, first_name: 1 })
        .lean();
    }

    return filtered;
  });
}

export async function createStudent(
  ctx: RequestContext,
  input: StudentCreateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "create");

    const parsed = studentCreateSchema.parse(input);
    const normalizedEmail = parsed.email?.trim().toLowerCase();
    const { email: _email, password: _password, ...studentData } = parsed;

    let userId: Types.ObjectId | undefined;
    if (normalizedEmail) {
      const existingUser = await UserModel.findOne({
        school_id: ctx.school_id,
        email: normalizedEmail
      }).lean();

      if (existingUser) {
        throw new Error("A user with this email already exists.");
      }

      const createdUser = await UserModel.create({
        school_id: ctx.school_id,
        email: normalizedEmail,
        password_hash: hashPassword(parsed.password || "changeme123"),
        role: "student",
        permissions: [],
        profile: {
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          phone: parsed.guardian.phone
        },
        status: "active"
      });

      userId = createdUser._id;
    }

    const created = await StudentModel.create({
      ...studentData,
      admission_no: parsed.admission_no || (await nextAdmissionNumber(ctx.school_id)),
      class_id: new Types.ObjectId(parsed.class_id),
      user_id: userId,
      school_id: ctx.school_id
    });

    await writeAuditLog(ctx, {
      action: "create",
      entity_type: "student",
      entity_id: String(created._id),
      after: created.toObject()
    });

    return created.toObject();
  });
}

export async function updateStudent(
  ctx: RequestContext,
  id: string,
  input: StudentUpdateInput
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "update");

    const parsed = studentUpdateSchema.parse(input);
    const existing = await StudentModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Student not found.");
    }

    const patch = {
      ...parsed,
      ...(parsed.class_id ? { class_id: new Types.ObjectId(parsed.class_id) } : {})
    };

    const updated = await StudentModel.findOneAndUpdate(
      tenantFilter(ctx, { _id: id }),
      { $set: patch },
      { new: true, runValidators: true }
    ).lean();

    await writeAuditLog(ctx, {
      action: "update",
      entity_type: "student",
      entity_id: id,
      before: existing,
      after: updated
    });

    return updated;
  });
}

export async function deleteStudent(
  ctx: RequestContext,
  id: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "delete");

    const existing = await StudentModel.findOne(tenantFilter(ctx, { _id: id })).lean();
    if (!existing) {
      throw new Error("Student not found.");
    }

    const deleted = await StudentModel.findOneAndDelete(
      tenantFilter(ctx, { _id: id }),
      { returnDocument: "after" }
    ).lean();

    await writeAuditLog(ctx, {
      action: "delete",
      entity_type: "student",
      entity_id: id,
      before: existing
    });

    return { success: true, id };
  });
}
