import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { linkStudentToParent } from "@edu/shared/services/parent.service";

function sessionRequest(request: NextRequest) {
  return {
    cookies: Object.fromEntries(request.cookies.getAll().map((cookie) => [cookie.name, cookie.value])),
    headers: {
      authorization: request.headers.get("authorization") ?? undefined,
      "user-agent": request.headers.get("user-agent") ?? undefined
    },
    ip: request.headers.get("x-forwarded-for") ?? undefined
  };
}

/**
 * Link student to existing parent account
 */
export async function POST(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");
    const body = await request.json();

    const result = await linkStudentToParent(ctx, body);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message || "Failed to link student" } },
      { status: 500 }
    );
  }
}
