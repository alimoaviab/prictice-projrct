import type { Role, RequestContext } from "./core";

export type { Role, RequestContext };

/**
 * JWT payload shape produced by the Node backend. The future Go backend MUST
 * sign tokens with the same claim names and meanings — the frontend assumes
 * `school_id`, `role`, `permissions`, and `active_academic_year_id` are
 * present on every authenticated session.
 */
export interface AuthTokenPayload {
  sub: string;
  school_id: string;
  role: Role;
  permissions: string[];
  active_academic_year_id?: string;
  session_id: string;
  app: "school" | "super_admin";
  actor_email?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  schoolId: string;
  activeAcademicYearId?: string;
  profileId?: string;
  classId?: string;
  studentId?: string;
}
