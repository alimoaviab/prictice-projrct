import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { fail, ok } from "@edu/shared/utils/result";
import { sessionRequest } from "../../../_utils";
import { LiveExamService } from "@edu/shared/services/exams/live-exam.service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const { id } = await params;
    
    const [exam, submissions] = await Promise.all([
      LiveExamService.getExamById(ctx, id),
      LiveExamService.getSubmissions(ctx, id)
    ]);

    if (!exam) return NextResponse.json(fail("NOT_FOUND", "Exam not found", 404), { status: 404 });

    return NextResponse.json(ok({ exam, submissions }), { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/live-exams/[id]/monitor] Error:", error);
    return NextResponse.json(fail("ERROR", error.message, 400), { status: 400 });
  }
}
