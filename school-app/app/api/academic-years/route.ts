import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { createAcademicYear, listAcademicYears } from "@edu/shared/services/academic-year.service";

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

function getPaginationParams(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "9");

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : 9
  };
}

export async function GET(request: Request) {
  const ctx = getRequestContext(request);
  const result = await listAcademicYears(ctx, getPaginationParams(request));
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}

export async function POST(request: Request) {
  const ctx = getRequestContext(request);
  const body = await request.json();
  const result = await createAcademicYear(ctx, body);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}