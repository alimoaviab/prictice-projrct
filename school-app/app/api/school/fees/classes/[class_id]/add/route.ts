import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { addClassFee } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../../../_utils";

export async function POST(request: NextRequest, props: { params: Promise<{ class_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { class_id } = await props.params;
        const body = await request.json();
        const result = await addClassFee(ctx, class_id, body);
        return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
