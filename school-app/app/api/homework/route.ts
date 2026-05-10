import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createHomework, listHomework } from "@edu/shared/services/homework.service";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const academy_care_id = request.nextUrl.searchParams.get("academy_care_id") ?? undefined;
    const result = await listHomework(ctx, { academy_care_id });
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();
    const result = await createHomework(ctx, body);
    return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
  } catch (error: any) {
    console.error("[POST /api/homework] Error:", error?.message);
    console.error("[POST /api/homework] Full error:", error);
    if (error?.message?.includes("Authentication")) {
      return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
    }
    return NextResponse.json(
      fail("INTERNAL_ERROR", error?.message || "Failed to create homework", 500),
      { status: 500 }
    );
  }
}
