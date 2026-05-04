import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createSubject, listSubjects } from "@edu/shared/services/subject.service";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await listSubjects(ctx);
        return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    } catch (error) {
        console.error("[GET /api/subjects] Authentication error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const body = await request.json();
        const result = await createSubject(ctx, body);
        return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
    } catch (error) {
        console.error("[POST /api/subjects] Authentication error:", error);
        return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
}
