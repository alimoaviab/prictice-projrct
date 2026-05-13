import { NextResponse } from "next/server";
import { getRequestContext, getQuery, safeRoute } from "../../../lib/api-utils";
import { createSubject, listSubjects } from "@edu/shared/services/subject.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listSubjects(ctx, getQuery(request));
    return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createSubject(ctx, await request.json());
    return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
  });
}
