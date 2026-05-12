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
import { resolveClassIdsForAcademicYear } from "./_academic-year-filter";
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
  filter: { class_id?: string; status?: string; academic_year_id?: string } = {}
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();
    assertPermission(ctx, "students", "view");

    // Resolve Academic Year strictly
    let academicYearId = filter.academic_year_id;
    if (!academicYearId || academicYearId === "undefined") {
      const { resolveAcademicYearId } = await import("./_academic-year-filter");
      academicYearId = await resolveAcademicYearId(ctx);
    }

    const query = tenantFilter(ctx, {
      ...(filter.status ? { status: filter.status } : {}),
      ...(academicYearId ? { academic_year_id: new Types.ObjectId(academicYearId) } : {})
    });

    if (filter.class_id) {
      query.class_id = new Types.ObjectId(filter.class_id);
    }

    return StudentModel.find(query).sort({ last_name: 1, first_name: 1 }).lean();
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

    // 1. Resolve Academic Year
    const { AcademicYearModel } = await import("../models/academic-year.model");
    let academicYearId = ctx.active_academic_year_id;

    if (!academicYearId) {
      const activeYear = await AcademicYearModel.findOne(tenantFilter(ctx, { is_active: true }))
        .select("_id")
        .lean() as any;
      
      if (!activeYear) {
        throw new Error("No active academic year found for this school.");
      }
      academicYearId = String(activeYear._id);
    }

    const academicYear = { _id: new Types.ObjectId(academicYearId) };

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
      academic_year_id: academicYear._id,
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
