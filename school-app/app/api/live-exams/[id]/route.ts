import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, guardRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const { id } = await params;
    const exam = await LiveExamService.getExamById(ctx, id);

    if (!exam) return NextResponse.json(fail("NOT_FOUND", "Exam not found", 404), { status: 404 });

    return NextResponse.json(ok(exam), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = guardRequest(authenticateRequest(sessionRequest(request), "school"), "exams", "manage");
    const { id } = await params;
    const data = await request.json();

    const exam = await LiveExamService.updateExam(ctx, id, data);

    return NextResponse.json(ok(exam), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
