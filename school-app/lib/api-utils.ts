import { NextResponse } from "next/server";
import { authenticateRequest } from "@edu/shared/auth/middleware";
import { RequestContext, ServiceResult } from "@edu/shared/types/core";

export function parseCookies(cookieHeader: string | null) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((entry) => {
      const separatorIndex = entry.indexOf("=");
      return separatorIndex >= 0 ? [entry.slice(0, separatorIndex), entry.slice(separatorIndex + 1)] : [entry, ""];
    })
  );
}

/**
 * Authentication error class.
 * Route handlers can catch this and return a clean 401 response instead
 * of a 500 (which breaks client retries and produces ugly logs).
 */
export class ApiAuthError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "ApiAuthError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Resolves a validated request context or throws ApiAuthError.
 * Callers should either catch ApiAuthError directly or use `withAuth`.
 */
export function getRequestContext(request: Request): RequestContext {
  try {
    return authenticateRequest(
      {
        cookies: parseCookies(request.headers.get("cookie")),
        headers: Object.fromEntries(request.headers.entries())
      },
      "school"
    );
  } catch (error: any) {
    const message = error?.message || "Authentication failed";
    throw new ApiAuthError(message, 401, "UNAUTHORIZED");
  }
}

export function getQuery(request: Request) {
  return Object.fromEntries(new URL(request.url).searchParams.entries());
}

function buildAuthFailureResponse(err: ApiAuthError) {
  const response = NextResponse.json(
    {
      ok: false,
      success: false,
      message: err.message,
      error: { code: err.code, message: err.message, status: err.status }
    },
    { status: err.status }
  );
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return response;
}

export function handleApiResponse<T>(result: ServiceResult<T>) {
  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  const status = (result as any).error?.status || 400;
  return NextResponse.json(result, { status });
}

/**
 * Wraps a route handler so auth errors automatically return 401 with a clean
 * response. Also clears the invalid session cookie so the client can
 * re-authenticate without stale state.
 */
export function withAuth(
  handler: (request: Request, ctx: RequestContext, ...args: any[]) => Promise<Response | NextResponse>
) {
  return async (request: Request, ...args: any[]) => {
    try {
      const ctx = getRequestContext(request);
      return await handler(request, ctx, ...args);
    } catch (error: any) {
      if (error instanceof ApiAuthError) {
        return buildAuthFailureResponse(error);
      }

      console.error("[API] Unhandled error:", error);
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message: error?.message || "Internal server error",
          error: {
            code: "INTERNAL_ERROR",
            message: error?.message || "Internal server error",
            status: 500
          }
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Tiny helper — call in routes that don't yet use withAuth().
 * Wraps any top-level try/catch so auth errors become 401s and other
 * errors become a safe 500 without crashing Next.
 */
export async function safeRoute<T extends Response | NextResponse>(
  fn: () => Promise<T>
): Promise<Response | NextResponse> {
  try {
    return await fn();
  } catch (error: any) {
    if (error instanceof ApiAuthError) {
      return buildAuthFailureResponse(error);
    }
    console.error("[API safeRoute] error:", error);
    return NextResponse.json(
      {
        ok: false,
        success: false,
        message: error?.message || "Internal server error",
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Internal server error",
          status: 500
        }
      },
      { status: 500 }
    );
  }
}
