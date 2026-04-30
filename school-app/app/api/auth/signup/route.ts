import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
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

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            );
        }

        // TODO: Replace with actual database operations
        // Check if user already exists
        const userExists = false; // Placeholder

        if (userExists) {
            return NextResponse.json(
                { message: "Email already registered" },
                { status: 409 }
            );
        }

        // TODO: Hash password before storing
        // TODO: Save user to database

        // TODO: Generate actual JWT token
        const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

        return NextResponse.json(
            { token, email, message: "Account created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
