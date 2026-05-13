import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { hashPassword } from "@edu/shared/auth/password";
import { SchoolModel } from "@edu/shared/models/school.model";
import { UserModel } from "@edu/shared/models/user.model";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";

function normalizeSchoolCode(name: string): string {
    const compact = name.replace(/\s+/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return compact.slice(0, 10) || "SCHOOL";
}

async function generateUniqueSchoolCode(name: string): Promise<string> {
    const base = normalizeSchoolCode(name);

    const existingBase = await SchoolModel.exists({ code: base });
    if (!existingBase) {
        return base;
    }

    for (let i = 0; i < 10; i += 1) {
        const suffix = randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
        const candidate = `${base.slice(0, 5)}${suffix}`;
        const exists = await SchoolModel.exists({ code: candidate });
        if (!exists) {
            return candidate;
        }
    }

    return `SCH${randomUUID().replace(/-/g, "").slice(0, 7).toUpperCase()}`;
}

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
        const role = String(body?.role || "admin").toLowerCase();
        const email = String(body?.email || "").trim().toLowerCase();
        const password = String(body?.password || "");
        const fullName = String(body?.admin_name || body?.fullName || "").trim();
        const schoolName = String(body?.school_name || body?.schoolName || "").trim();
        const schoolCodeInput = String(body?.school_code || body?.schoolCode || "").trim().toUpperCase();

        if (!["admin", "teacher", "student", "parent"].includes(role)) {
            return NextResponse.json(
                { ok: false, error: { message: "Invalid role selected" } },
                { status: 400 }
            );
        }

        // Validation
        if (!email || !password || !fullName) {
            return NextResponse.json(
                { ok: false, error: { message: "All fields are required" } },
                { status: 400 }
            );
        }

        if (role === "admin" && !schoolName) {
            return NextResponse.json(
                { ok: false, error: { message: "School name is required" } },
                { status: 400 }
            );
        }

        if (role !== "admin" && !schoolCodeInput) {
            return NextResponse.json(
                { ok: false, error: { message: "School code is required" } },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { ok: false, error: { message: "Password must be at least 6 characters" } },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (existingUser) {
            return NextResponse.json(
                { ok: false, error: { message: "Email already registered" } },
                { status: 409 }
            );
        }

        let school_id = "";
        let createdSchoolCode = "";
        let activeAcademicYearId: string | undefined = undefined;

        if (role === "admin") {
            // STEP 1: Generate unique school_id
            school_id = `SCH-${randomUUID().slice(0, 8).toUpperCase()}`;
            const uniqueSchoolCode = await generateUniqueSchoolCode(schoolName);

            // STEP 2: Create school
            await SchoolModel.create({
                school_id,
                name: schoolName,
                code: uniqueSchoolCode,
                status: "pending", // Default status for new registrations
                admin_profile: {
                    name: fullName,
                    email: email,
                },
                plan: {
                    key: "free",
                    seats: 0
                }
            });

            // STEP 3: Create default academic year
            const currentYear = new Date().getFullYear();
            const createdYear = await AcademicYearModel.create({
                school_id,
                year: `${currentYear}-${currentYear + 1}`,
                start_date: new Date(currentYear, 3, 1), // April 1
                end_date: new Date(currentYear + 1, 2, 31), // March 31
                is_active: true,
                status: "active",
                description: "Default academic year"
            });
            activeAcademicYearId = String(createdYear._id);

            createdSchoolCode = school_id;
        } else {
            const school = await SchoolModel.findOne({
                $or: [{ school_id: schoolCodeInput }, { code: schoolCodeInput }]
            }).lean();

            if (!school) {
                return NextResponse.json(
                    { ok: false, error: { message: "Invalid school code" } },
                    { status: 404 }
                );
            }

            school_id = String((school as any).school_id || "");
            if (!school_id) {
                return NextResponse.json(
                    { ok: false, error: { message: "School setup is invalid. Contact administrator." } },
                    { status: 400 }
                );
            }

            // Resolve the active academic year for this school
            const activeYear = await AcademicYearModel.findOne({
                school_id,
                is_active: true
            }).select("_id").lean() as { _id: unknown } | null;
            activeAcademicYearId = activeYear?._id ? String(activeYear._id) : undefined;
        }

        // STEP 4: Create user with school_id
        const createdUser = await UserModel.create({
            school_id,
            email,
            password_hash: hashPassword(password),
            role,
            permissions: role === "admin" ? ["*"] : [],
            profile: {
                first_name: fullName.split(" ")[0],
                last_name: fullName.split(" ").slice(1).join(" ") || ""
            },
            status: "active"
        });

        if (role === "admin") {
            return NextResponse.json(
                {
                    ok: true,
                    success: true,
                    message: "Your school account is under review. Please wait for approval.",
                    data: {
                        status: "pending",
                        school_id
                    }
                },
                { status: 201 }
            );
        }

        // STEP 5: Generate JWT with school_id (for students/teachers joining existing school)
        const token = signAuthToken({
            sub: String(createdUser._id),
            school_id,
            role,
            permissions: role === "admin" ? ["*"] : [],
            active_academic_year_id: activeAcademicYearId,
            session_id: randomUUID(),
            app: "school",
            actor_email: email
        });

        const response = NextResponse.json(
            {
                ok: true,
                success: true,
                data: {
                    role,
                    token,
                    email,
                    school_id,
                    schoolCode: createdSchoolCode || undefined,
                    active_academic_year_id: activeAcademicYearId
                }
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

        if ((error as any)?.code === 11000) {
            return NextResponse.json(
                { ok: false, error: { message: "This school or email already exists. Try a different value." } },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { ok: false, error: { message: "Signup failed. Please try again." } },
            { status: 500 }
        );
    }
}
