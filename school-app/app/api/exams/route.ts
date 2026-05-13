import { getRequestContext, getQuery, handleApiResponse, safeRoute } from "../../../lib/api-utils";
import { createExam, listExams } from "@edu/shared/services/exam.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listExams(ctx, getQuery(request));
    return handleApiResponse(result);
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createExam(ctx, await request.json());
    return handleApiResponse(result);
  });
}
