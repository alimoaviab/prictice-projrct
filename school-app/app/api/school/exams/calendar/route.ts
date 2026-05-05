import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getExamCalendar } from "@edu/shared/services/exam-flow.service";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await getExamCalendar(ctx, {
            exam_id: request.nextUrl.searchParams.get("exam_id") || undefined,
            class_id: request.nextUrl.searchParams.get("class_id") || undefined,
            academic_year_id: request.nextUrl.searchParams.get("academic_year_id") || undefined
        });
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
