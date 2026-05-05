import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { deleteFeeAdjustment, updateFeeAdjustment } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../../_utils";

export async function PUT(request: NextRequest, props: { params: Promise<{ adjustment_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { adjustment_id } = await props.params;
        const body = await request.json();
        const result = await updateFeeAdjustment(ctx, adjustment_id, body);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ adjustment_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { adjustment_id } = await props.params;
        const result = await deleteFeeAdjustment(ctx, adjustment_id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
