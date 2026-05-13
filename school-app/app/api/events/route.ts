import { NextResponse } from "next/server";
import { getRequestContext, getQuery, safeRoute } from "../../../lib/api-utils";
import { createEvent, listEvents } from "@edu/shared/services/event.service";

export async function GET(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await listEvents(ctx, getQuery(request));
    return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
  });
}

export async function POST(request: Request) {
  return safeRoute(async () => {
    const ctx = getRequestContext(request);
    const result = await createEvent(ctx, await request.json());
    return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
  });
}
