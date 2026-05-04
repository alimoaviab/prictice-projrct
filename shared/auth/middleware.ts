import { assertPermission } from "./rbac";
import { contextFromToken, verifyAuthToken } from "./jwt";
import { AppName, Feature, PermissionAction, RequestContext } from "../types/core";

export interface SessionRequest {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  ip?: string;
}

export function authenticateRequest(request: SessionRequest, expectedApp: AppName): RequestContext {
  // Priority 1: Check httpOnly session cookie (most secure)
  let token = request.cookies?.session;

  // Priority 2: Check Authorization Bearer header (fallback)
  if (!token && request.headers?.authorization) {
    const authHeader = request.headers.authorization;
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    token = match ? match[1] : undefined;
  }

  // Validate token format if present
  if (token) {
    token = token.trim();

    // Check if token looks like a valid JWT (starts with "eyJ")
    if (!token.startsWith("eyJ")) {
      console.error(`[Auth] Malformed token detected. Format: ${token.substring(0, 30)}...`);

      // In development, ignore malformed tokens and use dev context
      if (process.env.NODE_ENV === "development") {
        console.warn("[Auth] Dev mode: ignoring malformed token, using dev context");
        return {
          school_id: "dev-school-id",
          user_id: "dev-user-id",
          role: "admin",
          app: expectedApp,
          permissions: ["*"],
          session_id: "dev-session",
          actor_email: "dev@example.com",
          ip: request.ip,
          user_agent: request.headers?.["user-agent"]
        };
      }

      throw new Error("Invalid token format. Expected JWT starting with 'eyJ'.");
    }
  }

  // Development bypass: allow unauthenticated requests in dev mode
  if (!token && process.env.NODE_ENV === "development") {
    return {
      school_id: "dev-school-id",
      user_id: "dev-user-id",
      role: "admin",
      app: expectedApp,
      permissions: ["*"],
      session_id: "dev-session",
      actor_email: "dev@example.com",
      ip: request.ip,
      user_agent: request.headers?.["user-agent"]
    };
  }

  if (!token) {
    throw new Error("Authentication required.");
  }

  // Production requires valid token
  return contextFromToken(verifyAuthToken(token, expectedApp), {
    ip: request.ip,
    user_agent: request.headers?.["user-agent"]
  });
}

export function guardRequest(
  ctx: RequestContext,
  feature: Feature,
  action: PermissionAction
): RequestContext {
  assertPermission(ctx, feature, action);
  return ctx;
}
