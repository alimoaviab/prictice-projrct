/**
 * Pure-JS JWT helpers. We never *verify* tokens on the client (the server is
 * the source of truth), only decode the payload to read claims like `role`
 * and `school_id` for routing decisions.
 *
 * Mirrors school-react-app/src/utils/jwt.ts so claim handling is identical.
 */

import type { AuthTokenPayload } from '@/types/auth';

/** RFC-4648 base64url -> base64 -> UTF-8 string. */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  // atob exists on Hermes (RN) and on Node 16+. Fall back to Buffer just in case.
  if (typeof atob === 'function') {
    return decodeURIComponent(
      Array.prototype.map
        .call(atob(padded), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  }
  // @ts-ignore — Buffer only exists in Node-style envs.
  return Buffer.from(padded, 'base64').toString('utf-8');
}

export function decodeJwtPayload(token: string | null | undefined): AuthTokenPayload | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = base64UrlDecode(parts[1]);
    return JSON.parse(json) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(payload: AuthTokenPayload | null | undefined): boolean {
  if (!payload?.exp) return false; // No exp claim = treat as non-expiring.
  // Allow a 30-second clock skew buffer.
  return payload.exp * 1000 < Date.now() - 30_000;
}
