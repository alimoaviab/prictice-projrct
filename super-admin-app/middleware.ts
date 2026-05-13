import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-runtime safe middleware.
 * Only checks cookie existence; full JWT verification happens in API routes.
 * See school-app/middleware.ts for full explanation.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  // Allow login page, auth APIs, Next internals and static assets
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = !!request.cookies.get("session")?.value;

  if (!hasSession) {
    if (isApi) {
      return NextResponse.json(
        {
          ok: false,
          success: false,
          message: "Authentication required.",
          error: { code: "UNAUTHENTICATED", message: "No session token.", status: 401 }
        },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
