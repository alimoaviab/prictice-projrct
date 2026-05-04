import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { verifyPassword } from "@edu/shared/auth/password";
import { UserModel } from "@edu/shared/models/user.model";
import { TeacherModel } from "@edu/shared/models/teacher.model";
import { StudentModel } from "@edu/shared/models/student.model";

type LoginUser = {
    _id: unknown;
    school_id: string;
    role: "super_admin" | "admin" | "teacher" | "student";
    permissions?: string[];
    email: string;
    password_hash: string;
    status: string;
};

export async function POST(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();
        const { email, password, role } = body;

        // Validation
        if (!email || !password || !role) {
            return NextResponse.json(
                { message: "Email, password, and role are required" },
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
        
        if (user.status !== "active") {
            return NextResponse.json(
                { message: "Account is disabled or locked" },
                { status: 403 }
            );
        }

        if (user.role !== role && !(role === "admin" && user.role === "super_admin")) {
            return NextResponse.json(
                { message: `Invalid role selected. This account is registered as: ${user.role}` },
                { status: 403 }
            );
        }

        // Additional data integrity checks for specific roles
        if (user.role === "teacher") {
            const teacher = await TeacherModel.findOne({ user_id: user._id, status: "active" });
            if (!teacher) {
                return NextResponse.json({ message: "Teacher portfolio not found or inactive" }, { status: 403 });
            }
        } else if (user.role === "student") {
            const student = await StudentModel.findOne({ user_id: user._id, status: "active" });
            if (!student) {
                return NextResponse.json({ message: "Student enrollment not found or inactive" }, { status: 403 });
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

        const response = NextResponse.json(
            { token, email: user.email, role: user.role, message: "Login successful" },
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
