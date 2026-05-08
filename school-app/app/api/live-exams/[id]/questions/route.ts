import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, guardRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = guardRequest(authenticateRequest(sessionRequest(request), "school"), "exams", "manage");
    const { id } = await params;
    const { questions } = await request.json();

    const addedQuestions = await LiveExamService.addQuestions(ctx, id, questions);

    return NextResponse.json(ok(addedQuestions), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
