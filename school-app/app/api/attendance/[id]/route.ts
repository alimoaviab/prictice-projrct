import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { updateAttendance, deleteAttendance } from "@edu/shared/services/attendance.service";

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = getRequestContext(request);
  const result = await updateAttendance(ctx, params.id, await request.json());
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const ctx = getRequestContext(request);
  const result = await deleteAttendance(ctx, params.id);
  return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 400 });
}
