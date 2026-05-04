import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createTimetable, listTimetable } from "@edu/shared/services/timetable.service";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const class_id = request.nextUrl.searchParams.get("class_id") ?? undefined;
    const teacher_id = request.nextUrl.searchParams.get("teacher_id") ?? undefined;
    const day_of_week = request.nextUrl.searchParams.get("day_of_week") ? parseInt(request.nextUrl.searchParams.get("day_of_week")!) : undefined;
    const result = await listTimetable(ctx, { class_id, teacher_id, day_of_week });
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch (error: any) {
    console.error("[GET /api/timetable] Error:", error);
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = sessionRequest(request);
    const ctx = authenticateRequest(session, "school");

    const body = await request.json();
    console.log("[POST /api/timetable] Request body:", JSON.stringify(body, null, 2));

    const result = await createTimetable(ctx, body);
    console.log("[POST /api/timetable] Result:", JSON.stringify(result, null, 2));

    if (!result.ok) {
      console.error("[POST /api/timetable] Service error:", result.error);
      return NextResponse.json(result, { status: result.error.status ?? 400 });
    }

    console.log("[POST /api/timetable] Success:", result.data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/timetable] Unexpected error:", error);
    console.error("[POST /api/timetable] Error message:", error?.message);
    console.error("[POST /api/timetable] Error stack:", error?.stack);

    // Return detailed error for debugging
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        fail("VALIDATION_ERROR", `Invalid JSON: ${error.message}`, 400),
        { status: 400 }
      );
    }

    return NextResponse.json(
      fail("INTERNAL_ERROR", error.message || "Failed to create timetable entry", 500),
      { status: 500 }
    );
  }
}
