import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail } from "@edu/shared/utils/result";
import { updateAcademicYear } from "@edu/shared/services/academic-year.service";
import { sessionRequest } from "../../_utils";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();
    const { id } = await params;
    const result = await updateAcademicYear(ctx, id, body);
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
  } catch {
    return NextResponse.json(fail("UNAUTHORIZED", "Authentication required.", 401), { status: 401 });
  }
}
