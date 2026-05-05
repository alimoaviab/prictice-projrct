import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getPaymentByReceipt } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ receipt_no: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { receipt_no } = await props.params;
        const result = await getPaymentByReceipt(ctx, receipt_no);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
