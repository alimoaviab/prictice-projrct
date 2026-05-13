import { getRequestContext, getQuery, handleApiResponse, safeRoute } from "../../../lib/api-utils";
import { createTeacher, listTeachers } from "@edu/shared/services/teacher.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listTeachers(ctx, getQuery(request));
    return handleApiResponse(result);
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createTeacher(ctx, await request.json());
    return handleApiResponse(result);
  });
}
