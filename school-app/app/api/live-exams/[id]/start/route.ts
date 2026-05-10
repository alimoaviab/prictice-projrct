import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const { id } = await params;
    // Using ctx.user_id as studentId assuming direct mapping
    const studentId = ctx.user_id;

    const submission = await LiveExamService.startExamAttempt(ctx, id, studentId);

    return NextResponse.json(ok(submission), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
