import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getStudentResultCard } from "@edu/shared/services/exam-flow.service";
import { sessionRequest } from "../../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string; student_id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id, student_id } = await props.params;
        const result = await getStudentResultCard(ctx, id, student_id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
