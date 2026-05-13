import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

/**
 * EDGE-RUNTIME SAFE MIDDLEWARE
 *
 * Why this file does NOT use `verifyAuthToken`:
 * - Next.js middleware runs on the Edge Runtime on Vercel.
 * - The `jsonwebtoken` package (used in `shared/auth/jwt.ts`) depends on
 *   Node.js APIs that are NOT available in the Edge Runtime.
 * - Importing it here caused a silent crash on Vercel — the user would
 *   click "Log in", redirect to /admin/dashboard, middleware would fail
 *   to load, and the browser would render a blank page with no console
 *   error and no network request (the response was never produced).
 *
 * What we do instead:
 * - Middleware performs *only* cheap edge-safe checks: does a session
 *   cookie exist? is the path public? is the pathname protected?
 * - Full JWT verification happens in API routes (Node runtime) via
 *   `authenticateRequest`, which CAN use jsonwebtoken safely.
 * - If an auth failure happens inside an API route, the route returns
 *   401 and the client `service-client.ts` auto-redirects to /auth/login.
 */

const PUBLIC_PATHS = new Set([
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/unauthorized"
]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.includes(".")) return true; // static asset
  return false;
}

function isProtectedPage(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/parent")
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = !!request.cookies.get("session")?.value;

  if (!isProtectedPage(pathname) && !pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    // API without session → 401 JSON (client will redirect)
    if (pathname.startsWith("/api/")) {
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

    // Page without session → redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists → let the downstream route validate the JWT in Node runtime.
  // This avoids loading `jsonwebtoken` inside Edge Runtime.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
    "/api/:path*"
  ]
};
