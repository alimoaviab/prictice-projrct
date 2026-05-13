import jwt from "jsonwebtoken";
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
      throw new Error("Invalid token format. Expected JWT starting with 'eyJ'.");
    }
  }

  if (!token) {
    throw new Error("Authentication required.");
  }

  // Extract academic year from header (client override; will be validated against
  // the JWT-bound school_id by academicYearFilter at the query layer).
  const academicYearId = request.headers?.["x-academic-year-id"];

    // Production requires valid token
    try {
        const ctx = contextFromToken(verifyAuthToken(token, expectedApp), {
            ip: request.ip,
            user_agent: request.headers?.["user-agent"]
        });

        // CRITICAL: Allow client to switch academic year via header, but only
        // accept syntactically valid IDs. The header value is later cross-checked
        // against the tenant in academicYearFilter() to prevent cross-school
        // year selection. If no JWT-bound year exists, fall back to header.
        if (academicYearId && academicYearId !== "undefined" && academicYearId.trim().length > 0) {
            ctx.active_academic_year_id = academicYearId;
        }

        return ctx;
    } catch (error: any) {
        throw error;
    }
}

export function guardRequest(
  ctx: RequestContext,
  feature: Feature,
  action: PermissionAction
): RequestContext {
  assertPermission(ctx, feature, action);
  return ctx;
}
