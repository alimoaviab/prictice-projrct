import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { createClass, listClasses } from "@edu/shared/services/class.service";
import { sessionRequest } from "../_utils";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const academy_care_id = request.nextUrl.searchParams.get("academy_care_id");
    const query = academy_care_id ? { academy_care_id } : {};
    const result = await listClasses(ctx, query);
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch (error) {
    console.error("[GET /api/classes] Authentication error:", error);
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();
    const result = await createClass(ctx, body);
    return NextResponse.json(result, { status: result.ok ? 201 : result.error.status ?? 400 });
  } catch (error) {
    console.error("[POST /api/classes] Authentication error:", error);
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}
