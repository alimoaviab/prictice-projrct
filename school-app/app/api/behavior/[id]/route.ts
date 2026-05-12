import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { deleteBehavior, getBehavior, updateBehavior } from "@edu/shared/services/behavior.service";

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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await getBehavior(ctx, id);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await updateBehavior(ctx, id, await request.json());
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = getRequestContext(request);
  const { id } = await context.params;
  const result = await deleteBehavior(ctx, id);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}