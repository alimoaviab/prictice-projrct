import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const { isAutoSubmit } = await request.json();

    const submission = await LiveExamService.submitExam(ctx, id, isAutoSubmit);

    return NextResponse.json(ok(submission), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
