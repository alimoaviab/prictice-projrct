import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { updateExamSchedule } from "@edu/shared/services/exam-flow.service";
import { sessionRequest } from "../../../../_utils";

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const body = await request.json();
        const result = await updateExamSchedule(ctx, id, Array.isArray(body?.schedule) ? body.schedule : []);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
