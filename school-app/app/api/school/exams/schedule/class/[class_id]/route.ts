import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getExamScheduleByClass } from "@edu/shared/services/exam-flow.service";
import { sessionRequest } from "../../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ class_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { class_id } = await props.params;
        const result = await getExamScheduleByClass(ctx, class_id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
