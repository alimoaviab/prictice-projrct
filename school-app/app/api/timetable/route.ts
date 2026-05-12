import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { createTimetable, listTimetable } from "@edu/shared/services/timetable.service";

function parseCookies(cookieHeader: string | null) {
  return Object.fromEntries(
    (cookieHeader?.split("; ") ?? []).map((entry) => {
      const separatorIndex = entry.indexOf("=");
      return separatorIndex >= 0 ? [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)] : [entry, ""];
    })
  );
}

function getRequestContext(request: Request) {
  return authenticateRequest(
    {
      cookies: parseCookies(request.headers.get("cookie")),
      headers: Object.fromEntries(request.headers.entries())
    },
    "school"
  );
}

function getQuery(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

export async function GET(request: Request) {
  const ctx = getRequestContext(request);
  const result = await listTimetable(ctx, getQuery(request));
  return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
}

export async function POST(request: Request) {
  const ctx = getRequestContext(request);
  const result = await createTimetable(ctx, await request.json());
  return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
}
