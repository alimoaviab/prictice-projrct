import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { verifyPassword } from "@edu/shared/auth/password";
import type { Role } from "@edu/shared/types/core";
import { UserModel } from "@edu/shared/models/user.model";
import { TeacherModel } from "@edu/shared/models/teacher.model";
import { StudentModel } from "@edu/shared/models/student.model";

import { ParentModel } from "@edu/shared/models/parent.model";

type LoginUser = {
    _id: unknown;
    school_id: string;
    role: Role;
    permissions?: string[];
    email: string;
    password_hash: string;
    status: string;
};

export async function POST(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();
        const { email, password, role: requestedRole } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        const user = (await UserModel.findOne({
            email: email.toLowerCase()
        })
            .select("_id school_id role permissions email password_hash status")
            .lean()) as LoginUser | null;

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // ROLE ISOLATION CHECK
        if (requestedRole && user.role !== requestedRole) {
            // Special error message for better UX
            const roleLabels: Record<string, string> = {
                admin: "an Administrator",
                teacher: "a Teacher",
                student: "a Student",
                parent: "a Parent"
            };
            const portalLabels: Record<string, string> = {
                admin: "Admin",
                teacher: "Teacher",
                student: "Student",
                parent: "Parent"
            };

            return NextResponse.json(
                { 
                    message: `This account is registered as ${roleLabels[user.role] || "another role"}. Please switch to the ${portalLabels[user.role] || ""} portal.` 
                },
                { status: 403 }
            );
        }

        if (user.status !== "active") {
            return NextResponse.json(
                { message: "Account is disabled or locked" },
                { status: 403 }
            );
        }

        // Get active academic year for the school
        const { AcademicYearModel } = await import("@edu/shared/models/academic-year.model");
        const activeAcademicYear = (await AcademicYearModel.findOne({
            school_id: user.school_id,
            is_active: true
        }).select("_id").lean()) as { _id: string } | null;

        if (!activeAcademicYear) {
            console.warn(`[Login] No active academic year for school: ${user.school_id}`);
        }

        let profileId: string | undefined;
        let classId: string | undefined;
        let studentId: string | undefined;

        // Additional data integrity checks for specific roles
        if (user.role === "teacher") {
            let teacher = await TeacherModel.findOne({ user_id: user._id, status: "active" });
            
            // AUTO-RECOVERY: If no link exists, try to link by email
            if (!teacher) {
                teacher = await TeacherModel.findOne({ 
                    school_id: user.school_id, 
                    email: user.email.toLowerCase(),
                    user_id: { $exists: false }
                });

                if (teacher) {
                    await TeacherModel.updateOne({ _id: teacher._id }, { $set: { user_id: user._id } });
                }
            }
            if (teacher) profileId = String(teacher._id);
        } else if (user.role === "student") {
            const student = await StudentModel.findOne({ user_id: user._id, status: "active" });
            if (student) {
                profileId = String(student._id);
                studentId = String(student._id);
                classId = String(student.class_id);
            }
        } else if (user.role === "parent") {
            const parent = await ParentModel.findOne({ user_id: user._id, status: "active" })
                .populate("student_id");
            if (parent) {
                profileId = String(parent._id);
                studentId = String(parent.student_id?._id || parent.student_id);
                classId = String((parent.student_id as any)?.class_id || "");
            }
        }

        const token = signAuthToken({
            sub: String(user._id),
            school_id: user.school_id,
            role: user.role,
            permissions: user.permissions ?? [],
            active_academic_year_id: activeAcademicYear ? String(activeAcademicYear._id) : undefined,
            session_id: randomUUID(),
            app: "school",
            actor_email: user.email
        });

        const response = NextResponse.json(
            { 
                token, 
                email: user.email, 
                role: user.role, 
                profile_id: profileId,
                class_id: classId,
                student_id: studentId,
                message: "Login successful" 
            },
            { status: 200 }
        );

        response.cookies.set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
