import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getStudentFees } from "@edu/shared/services/fee-flow.service";
import { sessionRequest } from "../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ student_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { student_id } = await props.params;
        const result = await getStudentFees(ctx, student_id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}