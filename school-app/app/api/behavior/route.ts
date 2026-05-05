import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createBehavior, listBehavior } from "@edu/shared/services/behavior.service";
import { createBehaviorSchema } from "@edu/shared/validation/behavior.schema";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const status = request.nextUrl.searchParams.get("status") ?? undefined;
    const severity = request.nextUrl.searchParams.get("severity") ?? undefined;
    const incident_type = request.nextUrl.searchParams.get("incident_type") ?? undefined;
    const student_id = request.nextUrl.searchParams.get("student_id") ?? undefined;
    const class_id = request.nextUrl.searchParams.get("class_id") ?? undefined;
    const result = await listBehavior(ctx, { status, severity, incident_type, student_id, class_id });
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();

    // Validate request body
    const validation = createBehaviorSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        fail("VALIDATION_FAILED", "Invalid behavior record data", 400, { errors }),
        { status: 400 }
      );
    }

    const result = await createBehavior(ctx, validation.data);
    return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}
