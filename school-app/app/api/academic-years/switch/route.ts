import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { signAuthToken } from "@edu/shared/auth/jwt";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";
import { tenantFilter } from "@edu/shared/db/tenant-query";

function parseCookies(cookieHeader: string | null) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split("; ").map((entry) => {
            const i = entry.indexOf("=");
            return i >= 0 ? [entry.slice(0, i), entry.slice(i + 1)] : [entry, ""];
        })
    );
}

/**
 * CRITICAL: Academic Year Switch Endpoint
 *
 * Switches the active academic year context for the authenticated user.
 *
 * Security:
 *  - Verifies the requesting JWT.
 *  - Confirms the requested year exists in the SAME tenant (school_id).
 *  - Re-issues a JWT carrying the new active_academic_year_id.
 *
 * The client MUST replace its stored token / session cookie with the value
 * returned here. After switching, every subsequent API call inherits the
 * new academic year via JWT, NOT via an untrusted header.
 */
export async function POST(request: Request) {
    try {
        await connectDb();

        const ctx = authenticateRequest(
            {
                cookies: parseCookies(request.headers.get("cookie")),
                headers: Object.fromEntries(request.headers.entries())
            },
            "school"
        );

        const body = await request.json().catch(() => ({}));
        const academicYearId = String(body?.academic_year_id || "").trim();

        if (!academicYearId) {
            return NextResponse.json(
                { ok: false, message: "academic_year_id is required" },
                { status: 400 }
            );
        }

        // CRITICAL: Confirm the year belongs to the requesting tenant.
        const year = await AcademicYearModel.findOne(
            tenantFilter(ctx, { _id: academicYearId })
        )
            .select("_id year is_active")
            .lean() as { _id: unknown; year: string; is_active: boolean } | null;

        if (!year) {
            return NextResponse.json(
                { ok: false, message: "Academic year not found in this school." },
                { status: 404 }
            );
        }

        // Re-issue JWT with the validated active academic year
        const newToken = signAuthToken({
            sub: ctx.user_id,
            school_id: ctx.school_id,
            role: ctx.role,
            permissions: ctx.permissions ?? [],
            active_academic_year_id: String(year._id),
            session_id: ctx.session_id || `sess_${Date.now()}`,
            app: "school",
            actor_email: ctx.actor_email
        });

        const response = NextResponse.json({
            ok: true,
            data: {
                token: newToken,
                academic_year_id: String(year._id),
                year: year.year,
                is_active: year.is_active
            }
        });

        response.cookies.set("session", newToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 8
        });

        return response;
    } catch (error: any) {
        const status = error?.status || 401;
        return NextResponse.json(
            { ok: false, message: error?.message || "Authentication required." },
            { status }
        );
    }
}
