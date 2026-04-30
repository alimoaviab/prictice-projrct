import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { verifyPassword } from "@edu/shared/auth/password";
import { UserModel } from "@edu/shared/models/user.model";

type LoginUser = {
    _id: unknown;
    school_id: string;
    role: "super_admin" | "admin" | "teacher" | "student";
    permissions?: string[];
    email: string;
    password_hash: string;
};

export async function POST(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();
        const { email, password } = body;

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
            email: email.toLowerCase(),
            status: "active"
        })
            .select("_id school_id role permissions email password_hash")
            .lean()) as LoginUser | null;

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
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
