import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { deleteClassFee, updateClassFee } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../../../_utils";

export async function PUT(request: NextRequest, props: { params: Promise<{ class_id: string; fee_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { class_id, fee_id } = await props.params;
        const body = await request.json();
        const result = await updateClassFee(ctx, class_id, fee_id, body);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ class_id: string; fee_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { class_id, fee_id } = await props.params;
        const result = await deleteClassFee(ctx, class_id, fee_id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
