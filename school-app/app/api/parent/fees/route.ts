import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getFeesReport } from "@edu/shared/services/parent-portal.service";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await getFeesReport(ctx, request.nextUrl.searchParams.get("student_id") || undefined);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
