import { NextRequest, NextResponse } from "next/server";
import { UserModel, SchoolModel } from "@edu/shared/models";
import { hashPassword } from "@edu/shared/auth/password";
import { connectDb } from "@edu/shared/db/connect";

export async function POST(request: NextRequest) {
    try {
        await connectDb();

        const body = await request.json();
        const { schoolName, email, password, confirmPassword } = body;

        // Validation
        if (!schoolName || !email || !password || !confirmPassword) {
            return NextResponse.json(
                { ok: false, error: { message: "All fields are required" } },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { ok: false, error: { message: "Passwords do not match" } },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { ok: false, error: { message: "Password must be at least 8 characters" } },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { ok: false, error: { message: "Invalid email format" } },
                { status: 400 }
            );
        }

        // Check if email already in use globally (or across users)
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { ok: false, error: { message: "Email is already registered" } },
                { status: 409 }
            );
        }

        const schoolCodeBase = schoolName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8) || "SCHOOL";
        const suffix = Date.now().toString().slice(-4);
        const schoolCode = `${schoolCodeBase}${suffix}`;
        const schoolId = `school-${Date.now()}`;
        const schoolDomain = `${schoolName.toLowerCase().replace(/[^a-z0-9]/g, "") || "school"}.eduplexo.com`;

        // Create Tenant (School)
        const newSchool = new SchoolModel({
            school_id: schoolId,
            name: schoolName,
            code: schoolCode,
            domains: [schoolDomain],
            status: "active",
        });
        await newSchool.save();

        // Create Admin User
        const newUser = new UserModel({
            school_id: schoolId,
            email: email.toLowerCase(),
            password_hash: hashPassword(password),
            role: "admin",
            permissions: ["*"],
            status: "active"
        });
        await newUser.save();

        return NextResponse.json({ ok: true, data: { message: "Admin account created successfully. You can now log in." } }, { status: 201 });
    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { ok: false, error: { message: "Internal server error" } },
            { status: 500 }
        );
    }
}
