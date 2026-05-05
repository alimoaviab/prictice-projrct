import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { listMonthlyFees } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await listMonthlyFees(ctx, {
            class_id: request.nextUrl.searchParams.get("class_id") || undefined,
            month: request.nextUrl.searchParams.get("month") || undefined,
            year: request.nextUrl.searchParams.get("year") || undefined,
            status: request.nextUrl.searchParams.get("status") || undefined,
            page: request.nextUrl.searchParams.get("page") || undefined,
            limit: request.nextUrl.searchParams.get("limit") || undefined,
        });
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
