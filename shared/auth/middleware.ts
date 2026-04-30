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

  if (!token) {
    throw new Error("Authentication required.");
  }

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
