import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { getParentChildren } from "@edu/shared/services/parent.service";

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
 * Get all children linked to the logged-in parent
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = authenticateRequest(sessionRequest(request), "school");

    if (ctx.role !== "parent") {
      return NextResponse.json(
        { ok: false, error: { message: "Only parents can access this endpoint" } },
        { status: 403 }
      );
    }

    const result = await getParentChildren(ctx);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: { message: error.message || "Failed to get children" } },
      { status: 500 }
    );
  }
}
