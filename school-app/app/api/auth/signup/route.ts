import { NextRequest, NextResponse } from "next/server";
import { UserModel, SchoolModel } from "@edu/shared/models";
import { hashPassword } from "@edu/shared/auth/password";
import { connectDb } from "@edu/shared/db/connect";

export async function POST(request: NextRequest) {
    try {
        await connectDb();

        const body = await request.json();
        const { fullName, email, password, role, schoolName, schoolCode } = body;

        // Basic Validation
        if (!fullName || !email || !password || !role) {
            return NextResponse.json(
                { ok: false, error: { message: "Required fields are missing" } },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { ok: false, error: { message: "Password must be at least 8 characters" } },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { ok: false, error: { message: "Email is already registered" } },
                { status: 409 }
            );
        }

        let targetSchoolId: string;
        let finalSchoolCode: string | undefined;

        if (role === "admin") {
            // Logic for creating a NEW school
            if (!schoolName) {
                return NextResponse.json(
                    { ok: false, error: { message: "School name is required for administrators" } },
                    { status: 400 }
                );
            }

            const schoolCodeBase = schoolName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "SCH";
            const suffix = Math.floor(1000 + Math.random() * 9000);
            finalSchoolCode = `${schoolCodeBase}-${suffix}`;
            targetSchoolId = `school-${Date.now()}`;

            const newSchool = new SchoolModel({
                school_id: targetSchoolId,
                name: schoolName,
                code: finalSchoolCode,
                status: "active",
            });
            await newSchool.save();
        } else {
            // Logic for joining an EXISTING school
            if (!schoolCode) {
                return NextResponse.json(
                    { ok: false, error: { message: "School join code is required" } },
                    { status: 400 }
                );
            }

            const school = await SchoolModel.findOne({ code: schoolCode.toUpperCase() });
            if (!school) {
                return NextResponse.json(
                    { ok: false, error: { message: "Invalid school join code" } },
                    { status: 404 }
                );
            }
            targetSchoolId = school.school_id;
        }

        // Create User
        const newUser = new UserModel({
            school_id: targetSchoolId,
            email: email.toLowerCase(),
            password_hash: hashPassword(password),
            role: role,
            permissions: role === "admin" ? ["*"] : [],
            status: "active"
        });
        await newUser.save();

        return NextResponse.json({ 
            ok: true, 
            data: { 
                message: role === "admin" 
                    ? `School registered successfully. Your school join code is: ${finalSchoolCode}` 
                    : "Account created and linked to school successfully.",
                schoolCode: finalSchoolCode
            } 
        }, { status: 201 });

    } catch (error: any) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { ok: false, error: { message: "Internal server error" } },
            { status: 500 }
        );
    }
}
