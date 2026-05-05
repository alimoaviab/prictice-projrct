import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { validateTimetableConflicts } from "@edu/shared/services/timetable-generator.service";
import { sessionRequest } from "../../_utils";

export async function GET(request: NextRequest) {
    try {
        const ctx = authenticateRequest(sessionRequest(request), "school");
        const result = await validateTimetableConflicts(ctx);

        return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    } catch (error: any) {
        console.error("[GET /api/timetable/validate] Error:", error);
        return NextResponse.json(fail("INTERNAL_ERROR", "Failed to validate timetable", 500), { status: 500 });
    }
}
