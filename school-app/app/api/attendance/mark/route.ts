import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { markAttendanceBatch } from "@edu/shared/services/attendance-flow.service";
import { sessionRequest } from "../../_utils";

export async function POST(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const body = await request.json();
        const result = await markAttendanceBatch(ctx, body);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
