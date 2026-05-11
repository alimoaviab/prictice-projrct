import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { AppName, RequestContext, Role } from "../types/core";

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  school_id: string;
  role: Role;
  permissions: string[];
  active_academic_year_id?: string; // CRITICAL: Academic year context
  session_id: string;
  app: AppName;
  actor_email?: string;
}

export function signAuthToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
  secret = process.env.JWT_SECRET,
  expiresIn: SignOptions["expiresIn"] = "8h"
): string {
  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }

  return jwt.sign(payload, secret as Secret, { expiresIn });
}

export function verifyAuthToken(
  token: string,
  expectedApp: AppName,
  secret = process.env.JWT_SECRET
): AuthTokenPayload {
  if (!secret) {
    throw new Error("JWT_SECRET is required.");
  }

  // Validate token format before attempting to verify
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new Error("Token is empty or invalid.");
  }

  if (!token.startsWith("eyJ")) {
    throw new Error(`Invalid token format. Expected JWT, got: ${token.substring(0, 50)}`);
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthTokenPayload;
    if (decoded.app !== expectedApp) {
      throw new Error("Invalid application session.");
    }

    return decoded;
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      throw { name: "JsonWebTokenError", message: `JWT verification failed: ${error.message}. Token: ${token.substring(0, 50)}...` };
    } else if (error.name === "TokenExpiredError") {
      throw { name: "TokenExpiredError", message: "Token has expired. Please log in again." };
    }
    throw error;
  }
}

export function contextFromToken(
  payload: AuthTokenPayload,
  meta: Pick<RequestContext, "ip" | "user_agent"> = {}
): RequestContext {
  return {
    school_id: payload.school_id,
    user_id: payload.sub,
    role: payload.role,
    app: payload.app,
    permissions: payload.permissions ?? [],
    active_academic_year_id: payload.active_academic_year_id, // CRITICAL: Pass academic year
    session_id: payload.session_id,
    actor_email: payload.actor_email,
    ip: meta.ip,
    user_agent: meta.user_agent
  };
}
