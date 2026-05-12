import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { UserModel } from "@edu/shared/models";
import { verifyPassword } from "@edu/shared/auth/password";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { ControlledError } from "@edu/shared/types/core";

export async function POST(req: Request) {
  try {
    await connectDb();
    const { email, password, role: requestedRole } = await req.json();

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ ok: false, message: "Email and password are required and must be valid strings" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn(`[Login] User not found: ${email}`);
      // Prevent user enumeration via timing attack
      await new Promise(resolve => setTimeout(resolve, 0)); // Yield to event loop, simulate delay or do minimal work to mimic password hashing overhead, though scryptSync is synchronous
      verifyPassword(password, "ea182579743ddbac14f79b62554c5dc4:014ef2373807e6ca06b3a1914da6491264be1d3be7022adc5779304e6e92d45648ecb8af665dc2e226493266d93ef5fd2e26f980681d3647eacdefabbb4da323");
      return NextResponse.json({ ok: false, message: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Login] Password mismatch for: ${email}`);
      return NextResponse.json({ ok: false, message: "Invalid email or password" }, { status: 401 });
    }

    if (requestedRole && user.role !== requestedRole && user.role !== "super_admin") {
       // Allow mismatch for super_admin or handle gracefully
    }

    const token = signAuthToken({
      sub: String(user._id),
      school_id: user.school_id,
      role: user.role,
      permissions: user.permissions || [],
      session_id: `sess_${Date.now()}`,
      app: "school",
      actor_email: user.email
    });

    const response = NextResponse.json({
      ok: true,
      data: {
        role: user.role,
        token,
        user_id: user._id,
        email: user.email,
        school_id: user.school_id
      }
    });

    // Set cookie
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;

  } catch (error: any) {
    console.error("[Login Error]", error);
    return NextResponse.json({ 
      ok: false, 
      message: error.message || "An unexpected error occurred" 
    }, { status: error.status || 500 });
  }
}
