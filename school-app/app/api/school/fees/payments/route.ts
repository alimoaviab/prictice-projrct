import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { listPayments, recordPayment } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await listPayments(ctx, {
            student_id: request.nextUrl.searchParams.get("student_id") || undefined,
            date_from: request.nextUrl.searchParams.get("date_from") || undefined,
            date_to: request.nextUrl.searchParams.get("date_to") || undefined,
            method: request.nextUrl.searchParams.get("method") || undefined,
        });
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const body = await request.json();
        const result = await recordPayment(ctx, body);
        return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
