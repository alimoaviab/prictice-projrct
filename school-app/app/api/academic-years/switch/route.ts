import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { connectDb } from "@edu/shared/db/connect";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";
import { tenantFilter } from "@edu/shared/db/tenant-query";
import { fail } from "@edu/shared/utils/result";

function sessionRequest(request: NextRequest) {
  return {
    cookies: Object.fromEntries(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])),
    headers: {
      authorization: request.headers.get("authorization") ?? undefined,
      "user-agent": request.headers.get("user-agent") ?? undefined
    },
    ip: request.headers.get("x-forwarded-for") ?? undefined
  };
}

/**
 * CRITICAL: Academic Year Switching Endpoint
 * 
 * This endpoint allows admins to switch between academic years.
 * When switched, all data queries will automatically filter by the new academic year.
 * Historical data remains preserved and can be accessed by switching back.
 * 
 * Security:
 * - Only admins can switch academic years
 * - Academic year must belong to the same school (tenant isolation)
 * - New JWT token is issued with updated academic_year_id
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    
    // Only admins can switch academic years
    if (ctx.role !== "admin" && ctx.role !== "super_admin") {
      return NextResponse.json(
        fail("FORBIDDEN", "Only administrators can switch academic years.", 403),
        { status: 403 }
      );
    }

    await connectDb();
    const body = await request.json();
    const { academic_year_id } = body;

    if (!academic_year_id) {
      return NextResponse.json(
        fail("VALIDATION_ERROR", "academic_year_id is required.", 400),
        { status: 400 }
      );
    }

    // Verify academic year exists and belongs to this school
    const academicYear = await AcademicYearModel.findOne(
      tenantFilter(ctx, { _id: academic_year_id })
    ).lean();

    if (!academicYear) {
      return NextResponse.json(
        fail("NOT_FOUND", "Academic year not found or does not belong to your school.", 404),
        { status: 404 }
      );
    }

    // Generate new token with updated academic year
    const newToken = signAuthToken({
      sub: ctx.user_id,
      school_id: ctx.school_id,
      role: ctx.role,
      permissions: ctx.permissions,
      active_academic_year_id: String(academicYear._id),
      session_id: randomUUID(),
      app: "school",
      actor_email: ctx.actor_email
    });

    const response = NextResponse.json(
      {
        ok: true,
        success: true,
        data: {
          academic_year: academicYear,
          token: newToken
        },
        message: "Academic year switched successfully"
      },
      { status: 200 }
    );

    // Update session cookie
    response.cookies.set("session", newToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    return response;
  } catch (error: any) {
    console.error("Academic year switch error:", error);
    return NextResponse.json(
      fail("INTERNAL_ERROR", error.message || "Failed to switch academic year", 500),
      { status: 500 }
    );
  }
}
