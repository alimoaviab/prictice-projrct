import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest, guardRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    // Anyone authenticated can list exams (they are filtered by tenant)
    const status = request.nextUrl.searchParams.get("status") ?? undefined;

    const filters = status ? { status } : {};
    const exams = await LiveExamService.getExams(ctx, filters);

    return NextResponse.json(ok(exams), { status: 200 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = guardRequest(authenticateRequest(sessionRequest(request), "school"), "exams", "manage");
    const body = await request.json();

    const exam = await LiveExamService.createExam(ctx, body);

    return NextResponse.json(ok(exam), { status: 201 });
  } catch (error: any) {
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
