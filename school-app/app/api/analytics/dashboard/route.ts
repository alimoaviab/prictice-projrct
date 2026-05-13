import { NextResponse } from "next/server";
import { getRequestContext, ApiAuthError } from "../../../../lib/api-utils";
import { getAdminDashboardStats } from "@edu/shared/services/analytics.service";

export async function GET(request: Request) {
  try {
    const ctx = getRequestContext(request);
    const { searchParams } = new URL(request.url);
    const ayId = searchParams.get("academic_year_id") || undefined;

    const result = await getAdminDashboardStats(ctx, ayId);
    return NextResponse.json(result, { status: result.ok ? 200 : result.error?.status ?? 400 });
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message: error.message,
          error: { code: error.code, message: error.message, status: error.status }
        },
        { status: error.status }
      );
    }
    console.error("[analytics/dashboard] error:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: error?.message || "Internal error",
        error: { code: "INTERNAL_ERROR", message: error?.message || "Internal error", status: 500 }
      },
      { status: 500 }
    );
  }
}
