import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { AppName, RequestContext, Role } from "../types/core";

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  school_id: string;
  role: Role;
  permissions: string[];
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

  const decoded = jwt.verify(token, secret) as AuthTokenPayload;
  if (decoded.app !== expectedApp) {
    throw new Error("Invalid application session.");
  }

  return decoded;
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
    session_id: payload.session_id,
    actor_email: payload.actor_email,
    ip: meta.ip,
    user_agent: meta.user_agent
  };
}
