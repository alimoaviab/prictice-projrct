import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { UserModel } from "@edu/shared/models";
import { verifyPassword, DUMMY_HASH } from "@edu/shared/auth/password";
import { signAuthToken } from "@edu/shared/auth/jwt";

export async function POST(req: Request) {
  try {
    await connectDb();
    const { email, password } = await req.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ ok: false, message: "Email and password are required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Mitigate timing attacks by running the password verification against a dummy hash
      verifyPassword(password, DUMMY_HASH);
      return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "super_admin") {
      return NextResponse.json({ ok: false, message: "Unauthorized. Super Admin access only." }, { status: 403 });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ ok: false, message: "Invalid credentials" }, { status: 401 });
    }

    const token = signAuthToken({
      sub: String(user._id),
      school_id: user.school_id || "PLATFORM",
      role: user.role,
      permissions: user.permissions || [],
      session_id: `sess_${Date.now()}`,
      app: "super-admin",
      actor_email: user.email
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        role: user.role,
        token,
        email: user.email
      }
    });

    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;

  } catch (error: any) {
    return NextResponse.json({ 
      ok: false, 
      message: error.message || "An unexpected error occurred" 
    }, { status: 500 });
  }
}
