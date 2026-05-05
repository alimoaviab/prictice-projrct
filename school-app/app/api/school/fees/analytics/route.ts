import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getFeeAnalytics } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await getFeeAnalytics(ctx, {
            academic_year_id: request.nextUrl.searchParams.get("academic_year_id") || undefined,
            class_id: request.nextUrl.searchParams.get("class_id") || undefined,
            days_overdue: request.nextUrl.searchParams.get("days_overdue") || undefined,
            min_amount: request.nextUrl.searchParams.get("min_amount") || undefined,
        });
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
