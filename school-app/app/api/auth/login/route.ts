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

        // TODO: Replace with actual database query and password verification
        // For now, this is a placeholder implementation
        const mockUsers: Record<string, string> = {
            "student@example.com": "hashedPassword123"
        };

        if (!mockUsers[email]) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // TODO: Generate actual JWT token
        const token = Buffer.from(`${email}:${Date.now()}`).toString("base64");

        return NextResponse.json(
            { token, email, message: "Login successful" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
