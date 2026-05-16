/**
 * Auth types — kept aligned with school-react-app/src/types/auth.ts so the
 * mobile app and web app speak to the same backend identically.
 */

export type Role = 'super_admin' | 'admin' | 'teacher' | 'parent' | 'student';

/** UI tabs only ever offer these three. Backend may still issue any role. */
export type LoginRole = 'admin' | 'teacher' | 'student';

export interface AuthTokenPayload {
  sub: string;
  school_id: string;
  role: Role;
  permissions: string[];
  active_academic_year_id?: string;
  session_id: string;
  app: 'school' | 'super_admin';
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

export interface LoginRequest {
  email: string;
  password: string;
  role: LoginRole;
}

export interface LoginResponse {
  token: string;
  role: Role;
  profile_id?: string;
  class_id?: string;
  student_id?: string;
  active_academic_year_id?: string;
}
