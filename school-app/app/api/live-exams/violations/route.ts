import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const data = await request.json();

    const violation = await LiveExamService.logViolation(ctx, data);

    return NextResponse.json(ok(violation), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
