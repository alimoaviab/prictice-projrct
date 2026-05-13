import { getRequestContext, getQuery, handleApiResponse, safeRoute } from "../../../lib/api-utils";
import { createStudent, listStudents } from "@edu/shared/services/student.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listStudents(ctx, getQuery(request));
    return handleApiResponse(result);
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createStudent(ctx, await request.json());
    return handleApiResponse(result);
  });
}
