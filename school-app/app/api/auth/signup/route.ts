import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { hashPassword } from "@edu/shared/auth/password";
import { SchoolModel } from "@edu/shared/models/school.model";
import { UserModel } from "@edu/shared/models/user.model";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";

/**
 * CRITICAL: School Self-Signup Route
 * 
 * This creates a completely isolated new school with:
 * 1. Unique school_id
 * 2. Admin user
 * 3. Default academic year
 * 
 * Every record created after this will inherit the school_id
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb();
        const body = await request.json();
        const { school_name, admin_name, email, password } = body;

        // Validation
        if (!school_name || !admin_name || !email || !password) {
            return NextResponse.json(
                { message: "All fields are required" },
                { status: 400 }
            );
        }

        if (typeof school_name !== 'string' || typeof admin_name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { message: "All fields must be valid strings" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json(
                { message: "Email already registered" },
                { status: 409 }
            );
        }

        // STEP 1: Generate unique school_id
        const school_id = `SCH-${randomUUID().slice(0, 8).toUpperCase()}`;

        // STEP 2: Create school
        const school = await SchoolModel.create({
            school_id,
            name: school_name,
            code: school_name.substring(0, 10).toUpperCase().replace(/\s/g, ""),
            status: "active",
            subscription: {
                plan: "trial",
                status: "active",
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        // STEP 3: Create admin user with school_id
        const admin = await UserModel.create({
            school_id, // CRITICAL: Links user to school
            email: email.toLowerCase(),
            password_hash: hashPassword(password),
            role: "admin",
            permissions: ["*"], // Full permissions for admin
            profile: {
                first_name: admin_name.split(" ")[0],
                last_name: admin_name.split(" ").slice(1).join(" ") || ""
            },
            status: "active"
        });

        // STEP 4: Create default academic year
        const currentYear = new Date().getFullYear();
        await AcademicYearModel.create({
            school_id, // CRITICAL: Links academic year to school
            year: `${currentYear}-${currentYear + 1}`,
            start_date: new Date(currentYear, 3, 1), // April 1
            end_date: new Date(currentYear + 1, 2, 31), // March 31
            is_active: true,
            status: "active",
            description: "Default academic year"
        });

        // STEP 5: Generate JWT with school_id
        const token = signAuthToken({
            sub: String(admin._id),
            school_id, // CRITICAL: All future requests will use this school_id
            role: "admin",
            permissions: ["*"],
            session_id: randomUUID(),
            app: "school",
            actor_email: email.toLowerCase()
        });

        const response = NextResponse.json(
            {
                success: true,
                message: "School created successfully",
                school: {
                    id: school_id,
                    name: school_name
                },
                token,
                email: email.toLowerCase(),
                role: "admin"
            },
            { status: 201 }
        );

        // Set secure cookie
        response.cookies.set("session", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8 // 8 hours
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { message: "Failed to create school. Please try again." },
            { status: 500 }
        );
    }
}
