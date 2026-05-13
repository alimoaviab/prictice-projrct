import { getRequestContext, getQuery, handleApiResponse, safeRoute } from "../../../lib/api-utils";
import { createAcademicYear, listAcademicYears } from "@edu/shared/services/academic-year.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listAcademicYears(ctx, getQuery(request));
    return handleApiResponse(result);
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createAcademicYear(ctx, await request.json());
    return handleApiResponse(result);
  });
}
