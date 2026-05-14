/**
 * Browser-safe JWT decoder. Only decodes the payload — does not verify the
 * signature, that's the backend's job. Used by useAuth and helpers that need
 * to read claims like `school_id`, `role`, and `active_academic_year_id`.
 */

import type { AuthTokenPayload } from "@/types/auth";

export function decodeJwtPayload(token: string): AuthTokenPayload | null {
  const payloadPart = token.split(".")[1];
  if (!payloadPart) return null;
  try {
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AuthTokenPayload | null): boolean {
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
}
