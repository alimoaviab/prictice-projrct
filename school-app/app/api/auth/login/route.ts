import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { UserModel } from "@edu/shared/models";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";
import { verifyPassword } from "@edu/shared/auth/password";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { ControlledError } from "@edu/shared/types/core";

export async function POST(req: Request) {
  try {
    await connectDb();
    const { email, password, role: requestedRole } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Email and password are required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.warn(`[Login] User not found: ${email}`);
      return NextResponse.json({ ok: false, message: "Invalid email or password" }, { status: 401 });
    }

    const isMatch = verifyPassword(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[Login] Password mismatch for: ${email}`);
      return NextResponse.json({ ok: false, message: "Invalid email or password" }, { status: 401 });
    }

    // Check school status for non-super_admin users
    if (user.role !== "super_admin") {
      const school = await SchoolModel.findOne({ school_id: user.school_id }).lean();
      
      if (!school) {
        return NextResponse.json({ ok: false, message: "School registration not found." }, { status: 403 });
      }

      if (school.status === "pending") {
        return NextResponse.json({ 
          ok: false, 
          message: "Your school account is under review. Please wait for approval." 
        }, { status: 403 });
      }

      if (school.status === "rejected") {
        return NextResponse.json({ 
          ok: false, 
          message: "Your school registration was rejected. Contact support." 
        }, { status: 403 });
      }

      if (school.status === "suspended") {
        return NextResponse.json({ 
          ok: false, 
          message: "Your school account has been suspended. Please contact administration." 
        }, { status: 403 });
      }
    }

    if (requestedRole && user.role !== requestedRole && user.role !== "super_admin") {
       // Allow mismatch for super_admin or handle gracefully
    }

    // CRITICAL: Resolve active academic year for this school server-side.
    // The active year is bound to the JWT so the client cannot select another
    // school's academic year through the x-academic-year-id header.
    const activeAcademicYear = await AcademicYearModel.findOne({
      school_id: user.school_id,
      is_active: true
    }).select("_id").lean() as { _id: unknown } | null;

    const activeAcademicYearId = activeAcademicYear?._id ? String(activeAcademicYear._id) : undefined;

    const token = signAuthToken({
      sub: String(user._id),
      school_id: user.school_id,
      role: user.role,
      permissions: user.permissions || [],
      active_academic_year_id: activeAcademicYearId,
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
        school_id: user.school_id,
        active_academic_year_id: activeAcademicYearId
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
