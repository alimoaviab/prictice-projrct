import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getTeacherAttendanceSummary } from "@edu/shared/services/attendance-flow.service";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const date = request.nextUrl.searchParams.get("date") ?? undefined;
        const result = await getTeacherAttendanceSummary(ctx, date);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
