/**
 * Minimal JWT-shaped token generator for mock auth. It is NOT a real JWT —
 * the signature is unverified — but the payload format matches the original
 * backend so `useAuth`, `serviceRequest`, and tenant guards behave identically.
 *
 * Replace with the real backend's response once the Go service is up.
 */

import type { Role } from "@/types/auth";

const HEADER_B64 = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
  .replace(/=/g, "")
  .replace(/\+/g, "-")
  .replace(/\//g, "_");

function toBase64Url(value: string) {
  return btoa(value).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export interface MockTokenInput {
  sub: string;
  email: string;
  role: Role;
  schoolId: string;
  activeAcademicYearId?: string;
  permissions?: string[];
}

export function buildMockJwt(input: MockTokenInput): string {
  const payload = {
    sub: input.sub,
    school_id: input.schoolId,
    role: input.role,
    permissions: input.permissions ?? [],
    active_academic_year_id: input.activeAcademicYearId,
    session_id: `sess_${Date.now()}`,
    app: "school" as const,
    actor_email: input.email,
    iat: Math.floor(Date.now() / 1000),
    // 8-hour expiry, same as the original backend.
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  };

  return [HEADER_B64, toBase64Url(JSON.stringify(payload)), "mocksig"].join(".");
}
