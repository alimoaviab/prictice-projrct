import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getCurrentAcademicYear } from "@edu/shared/services/academic-year.service";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await getCurrentAcademicYear(ctx);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch (error) {
        console.error("[GET /api/school/academic-years/current] Error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
