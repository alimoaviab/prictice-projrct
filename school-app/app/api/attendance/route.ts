import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createAttendance, listAttendance } from "@edu/shared/services/attendance.service";
import { markAttendanceBatch } from "@edu/shared/services/attendance-flow.service";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const class_id = request.nextUrl.searchParams.get("class_id") ?? undefined;
    const student_id = request.nextUrl.searchParams.get("student_id") ?? undefined;
    const academy_care_id = request.nextUrl.searchParams.get("academy_care_id") ?? undefined;
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const result = await listAttendance(ctx, { class_id, student_id, academy_care_id, date });
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();
    if (body && typeof body === "object" && "records" in body) {
      const result = await markAttendanceBatch(ctx, body);
      return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
    }
    const result = await createAttendance(ctx, body);
    return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}
