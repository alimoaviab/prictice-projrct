import { Types } from "mongoose";
import { connectDb } from "../db/connect";
import { tenantFilter } from "../db/tenant-query";
import { ParentModel } from "../models/parent.model";
import { UserModel } from "../models/user.model";
import { StudentModel } from "../models/student.model";
import { RequestContext, ServiceResult } from "../types/core";
import { serviceTry } from "../utils/result";
import { hashPassword } from "../auth/password";

/**
 * MULTI-CHILD PARENT SERVICE
 * 
 * Handles parent-student linking with support for multiple children per parent.
 */

/**
 * Check if parent email already exists in the school
 */
export async function checkParentEmail(
  ctx: RequestContext,
  email: string
): Promise<ServiceResult<{ 
  exists: boolean; 
  role_mismatch?: boolean; 
  existing_role?: string; 
  parent_user_id?: string; 
  children_count?: number;
  parent?: any;
}>> {
  return serviceTry(async () => {
    await connectDb();
    const normalizedEmail = email.trim().toLowerCase();

    // Check for ANY user with this email in the same school
    const existingUser = (await UserModel.findOne(
      tenantFilter(ctx, { email: normalizedEmail })
    ).lean()) as any;

    if (!existingUser) {
      return { exists: false };
    }

    if (existingUser.role !== "parent") {
      return {
        exists: true,
        role_mismatch: true,
        existing_role: existingUser.role,
        parent: {
          _id: String(existingUser._id),
          name: `${existingUser.profile?.first_name || ""} ${existingUser.profile?.last_name || ""}`.trim(),
          email: existingUser.email,
          phone: existingUser.profile?.phone || ""
        }
      };
    }

    const childrenCount = await ParentModel.countDocuments(
      tenantFilter(ctx, { user_id: existingUser._id, status: "active" })
    );

    return {
      exists: true,
      role_mismatch: false,
      parent_user_id: String(existingUser._id),
      children_count: childrenCount,
      parent: {
        _id: String(existingUser._id),
        name: `${existingUser.profile?.first_name || ""} ${existingUser.profile?.last_name || ""}`.trim(),
        email: existingUser.email,
        phone: existingUser.profile?.phone || ""
      }
    };
  });
}

/**
 * Link student to existing parent account
 */
export async function linkStudentToParent(
  ctx: RequestContext,
  input: {
    parent_user_id: string;
    student_id: string;
    relationship?: string;
    is_primary?: boolean;
  }
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();

    // Verify parent user exists and belongs to same school
    const parentUser = await UserModel.findOne(
      tenantFilter(ctx, {
        _id: input.parent_user_id,
        role: "parent"
      })
    ).lean();

    if (!parentUser) {
      throw new Error("Parent user not found");
    }

    // Verify student exists and belongs to same school
    const student = await StudentModel.findOne(
      tenantFilter(ctx, {
        _id: input.student_id
      })
    ).lean();

    if (!student) {
      throw new Error("Student not found");
    }

    // Check if link already exists
    const existingLink = await ParentModel.findOne(
      tenantFilter(ctx, {
        user_id: input.parent_user_id,
        student_id: input.student_id
      })
    ).lean();

    if (existingLink) {
      throw new Error("Student is already linked to this parent");
    }

    // Create link
    const link = await ParentModel.create({
      school_id: ctx.school_id,
      user_id: new Types.ObjectId(input.parent_user_id),
      student_id: new Types.ObjectId(input.student_id),
      relationship: input.relationship || "guardian",
      is_primary: input.is_primary !== undefined ? input.is_primary : true,
      status: "active"
    });

    return {
      success: true,
      link_id: String(link._id),
      message: "Student linked to parent successfully"
    };
  });
}

/**
 * Create new parent and link to student
 */
export async function createParentAndLink(
  ctx: RequestContext,
  input: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    student_id: string;
    relationship?: string;
  }
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();

    const normalizedEmail = input.email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await UserModel.findOne(
      tenantFilter(ctx, { email: normalizedEmail })
    ).lean();

    if (existingUser) {
      throw new Error("Email already exists. Use link function instead.");
    }

    // Verify student exists
    const student = await StudentModel.findOne(
      tenantFilter(ctx, { _id: input.student_id })
    ).lean();

    if (!student) {
      throw new Error("Student not found");
    }

    // Create parent user
    const parentUser = await UserModel.create({
      school_id: ctx.school_id,
      email: normalizedEmail,
      password_hash: hashPassword(input.password),
      role: "parent",
      permissions: [],
      profile: {
        first_name: input.name.split(" ")[0],
        last_name: input.name.split(" ").slice(1).join(" ") || "",
        phone: input.phone || ""
      },
      status: "active"
    });

    // Create parent-student link
    const link = await ParentModel.create({
      school_id: ctx.school_id,
      user_id: parentUser._id,
      student_id: new Types.ObjectId(input.student_id),
      relationship: input.relationship || "guardian",
      is_primary: true,
      status: "active"
    });

    return {
      success: true,
      parent_user_id: String(parentUser._id),
      link_id: String(link._id),
      message: "Parent created and linked successfully"
    };
  });
}

/**
 * Get all children for a parent
 */
export async function getParentChildren(
  ctx: RequestContext
): Promise<ServiceResult<unknown[]>> {
  return serviceTry(async () => {
    await connectDb();

    // Get all active links for this parent
    const links = await ParentModel.find(
      tenantFilter(ctx, {
        user_id: ctx.user_id,
        status: "active"
      })
    )
      .populate({
        path: "student_id",
        select: "first_name last_name admission_no class_id section status",
        populate: {
          path: "class_id",
          select: "name section grade"
        }
      })
      .lean();

    return links.map((link: any) => ({
      link_id: String(link._id),
      student_id: String(link.student_id._id),
      student_name: `${link.student_id.first_name} ${link.student_id.last_name}`,
      admission_no: link.student_id.admission_no,
      class_name: link.student_id.class_id?.name || "",
      class_section: link.student_id.class_id?.section || "",
      grade: link.student_id.class_id?.grade || "",
      relationship: link.relationship,
      is_primary: link.is_primary,
      status: link.student_id.status
    }));
  });
}

/**
 * Unlink student from parent
 */
export async function unlinkStudentFromParent(
  ctx: RequestContext,
  linkId: string
): Promise<ServiceResult<unknown>> {
  return serviceTry(async () => {
    await connectDb();

    const deleted = await ParentModel.findOneAndDelete(
      tenantFilter(ctx, {
        _id: linkId,
        user_id: ctx.user_id
      })
    );

    if (!deleted) {
      throw new Error("Link not found or unauthorized");
    }

    return {
      success: true,
      message: "Student unlinked successfully"
    };
  });
}
