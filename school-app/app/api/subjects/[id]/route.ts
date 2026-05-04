import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { getSubject, updateSubject, deleteSubject } from "@edu/shared/services/subject.service";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await getSubject(ctx, params.id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
    } catch (error) {
        console.error(`[GET /api/subjects/${error}] Authentication error:`, error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const data = await request.json();
        const result = await updateSubject(ctx, params.id, data);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch (error) {
        console.error(`[PUT /api/subjects/${error}] Authentication error:`, error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await deleteSubject(ctx, params.id);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch (error) {
        console.error(`[DELETE /api/subjects/${error}] Authentication error:`, error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
