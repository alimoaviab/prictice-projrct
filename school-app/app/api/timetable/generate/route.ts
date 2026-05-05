import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { generateTimetable, validateTimetableConflicts } from "@edu/shared/services/timetable-generator.service";
import { sessionRequest } from "../../_utils";

export async function POST(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const body = await request.json();

        const result = await generateTimetable(ctx, body);
        return NextResponse.json(result, { status: result.ok ? 201 : 400 });
    } catch (error: any) {
        console.error("[POST /api/timetable/generate] Error:", error);
        return NextResponse.json(fail("INTERNAL_ERROR", "Failed to generate timetable", 500), { status: 500 });
    }
}
