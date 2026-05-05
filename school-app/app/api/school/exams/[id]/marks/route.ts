import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getExamMarks, saveMarks } from "@edu/shared/services/exam-flow.service";
import { sessionRequest } from "../../../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const result = await getExamMarks(ctx, id, {
            class_id: request.nextUrl.searchParams.get("class_id") || undefined,
            subject_id: request.nextUrl.searchParams.get("subject_id") || undefined
        });
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const { id } = await props.params;
        const body = await request.json();
        const result = await saveMarks(ctx, id, Array.isArray(body?.marks) ? body.marks : []);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch {
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
