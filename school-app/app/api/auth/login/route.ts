import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { verifyPassword } from "@edu/shared/auth/password";
import { UserModel } from "@edu/shared/models/user.model";
import { TeacherModel } from "@edu/shared/models/teacher.model";
import { StudentModel } from "@edu/shared/models/student.model";

import { ParentModel } from "@edu/shared/models/parent.model";

type LoginUser = {
    _id: unknown;
    school_id: string;
    role: "super_admin" | "admin" | "teacher" | "parent";
    permissions?: string[];
    email: string;
    password_hash: string;
    status: string;
};

export async function POST(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { message: "Invalid email or password format" },
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

        const dummyHash = "89184454f31b3dcb8caca08c705dae23:28a6cdf717180a808f9f69dd44e8de3fccf11b524d5df6865a3781a1d7b663a48af8dc1379cc44b95c639c11a73f1a6646b864d743fc29ad49135c9186626623";
        const isPasswordValid = user ? verifyPassword(password, user.password_hash) : verifyPassword(password, dummyHash) && false;

        if (!user || !isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }
        
        if (user.status !== "active") {
            return NextResponse.json(
                { message: "Account is disabled or locked" },
                { status: 403 }
            );
        }

        // Additional data integrity checks for specific roles
        if (user.role === "teacher") {
            const teacher = await TeacherModel.findOne({ user_id: user._id, status: "active" });
            if (!teacher) {
                return NextResponse.json({ message: "Teacher portfolio not found or inactive" }, { status: 403 });
            }
        } else if (user.role === "parent") {
            const parent = await ParentModel.findOne({ user_id: user._id, status: "active" });
            if (!parent) {
                return NextResponse.json({ message: "Parent profile not found or inactive" }, { status: 403 });
            }
        }

        const token = signAuthToken({
            sub: String(user._id),
            school_id: user.school_id,
            role: user.role,
            permissions: user.permissions ?? [],
            session_id: randomUUID(),
            app: "school",
            actor_email: user.email
        });

        let profileId: string | undefined;
        let classId: string | undefined;
        let studentId: string | undefined;

        if (user.role === "teacher") {
            const teacher = await TeacherModel.findOne({ user_id: user._id, status: "active" });
            if (teacher) profileId = String(teacher._id);
        } else if (user.role === "parent") {
            const parent = await ParentModel.findOne({ user_id: user._id, status: "active" })
                .populate("student_id");
            if (parent) {
                profileId = String(parent._id);
                studentId = String(parent.student_id?._id || parent.student_id);
                classId = String((parent.student_id as any)?.class_id || "");
            }
        }

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
