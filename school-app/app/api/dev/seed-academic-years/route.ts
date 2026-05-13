import { NextResponse } from "next/server";
import { connectDb } from "@edu/shared/db/connect";
import { AcademicYearModel } from "@edu/shared/models/academic-year.model";
import { authenticateRequest } from "@edu/shared/auth/middleware";

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
 * DEVELOPMENT-ONLY: Seed academic years for the authenticated tenant.
 *
 * Hardened from the previous implementation which:
 *   - had no auth
 *   - accepted school_id from query string (cross-tenant write vector)
 *
 * This endpoint is now:
 *   - Disabled in production
 *   - Auth-required
 *   - Restricted to admin role
 *   - Always scoped to the JWT school_id (no client-supplied school_id)
 */
export async function GET(request: Request) {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
            { ok: false, error: "Development seed endpoints are disabled in production." },
            { status: 404 }
        );
    }

    try {
        const ctx = authenticateRequest(
            {
                cookies: parseCookies(request.headers.get("cookie")),
                headers: Object.fromEntries(request.headers.entries())
            },
            "school"
        );

        if (ctx.role !== "admin" && ctx.role !== "super_admin") {
            return NextResponse.json(
                { ok: false, error: "Admin role required." },
                { status: 403 }
            );
        }

        await connectDb();
        const schoolId = ctx.school_id;

        const sessions = [];
        const baseYear = 2025;

        for (let i = 0; i < 20; i++) {
            const startYear = baseYear + i;
            const endYear = startYear + 1;
            sessions.push({
                school_id: schoolId,
                year: `${startYear}-${endYear}`,
                start_date: new Date(`${startYear}-01-01`),
                end_date: new Date(`${startYear}-12-31`),
                is_active: false,
                status: "draft",
                description: `Generated session for ${startYear}-${endYear}`
            });
        }

        await AcademicYearModel.insertMany(sessions, { ordered: false });

        return NextResponse.json({
            ok: true,
            message: `20 academic years created for ${schoolId}.`
        });
    } catch (error: any) {
        return NextResponse.json(
            { ok: false, error: error?.message || "Seed failed" },
            { status: error?.status || 500 }
        );
    }
}
