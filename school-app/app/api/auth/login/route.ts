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
                { message: "Email and password are required and must be strings" },
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

        // Prevent timing attacks by verifying against a dummy hash when user is not found
        const dummyHash = "811faa4d8e360fbddd02359fc9df172e:4545ebb3ccca52323699be5b8ff484255f32973c0bc4a94b156df26df5d2880f21d8e10db765b85e95c0d04e15496234ad5ec472e7a418433aad5821efc70103";
        const hashToVerify = user ? user.password_hash : dummyHash;
        const isValidPassword = verifyPassword(password, hashToVerify);

        if (!user || !isValidPassword) {
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
