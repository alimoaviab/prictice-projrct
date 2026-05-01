import { assertPermission } from "./rbac";
import { contextFromToken, verifyAuthToken } from "./jwt";
import { AppName, Feature, PermissionAction, RequestContext } from "../types/core";

export interface SessionRequest {
  cookies?: Record<string, string | undefined>;
  headers?: Record<string, string | undefined>;
  ip?: string;
}

export function authenticateRequest(request: SessionRequest, expectedApp: AppName): RequestContext {
  const token =
    request.cookies?.session ||
    request.headers?.authorization?.replace(/^Bearer\s+/i, "");

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
