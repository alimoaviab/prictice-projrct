export type Role = "super_admin" | "admin" | "teacher" | "parent" | "student";

export type AppName = "school" | "super_admin";

export type EntityType =
  | "school"
  | "user"
  | "student"
  | "teacher"
  | "class"
  | "attendance"
  | "homework"
  | "exam"
  | "result"
  | "fee"
  | "notification"
  | "sync_job"
  | "announcement"
  | "timetable"
  | "behavior"
  | "leave"
  | "event"
  | "parent";

export type PermissionAction = "view" | "create" | "update" | "delete" | "manage";

export type Feature =
  | "schools"
  | "users"
  | "settings"
  | "students"
  | "teachers"
  | "subjects"
  | "classes"
  | "attendance"
  | "homework"
  | "exams"
  | "results"
  | "fees"
  | "reports"
  | "notifications"
  | "audit_logs"
  | "platform"
  | "announcements"
  | "timetable"
  | "behavior"
  | "leave"
  | "events";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "deny"
  | "block"
  | "unblock"
  | "notify"
  | "sync_retry";

export interface RequestContext {
  school_id: string;
  user_id: string;
  role: Role;
  app: AppName;
  permissions: string[];
  session_id?: string;
  actor_email?: string;
  ip?: string;
  user_agent?: string;
}

export interface ServiceError {
  code: string;
  message: string;
  status?: number;
  details?: unknown;
}

export type ServiceResult<T> =
  | {
    ok: true;
    success: true;
    data: T;
    message?: string;
    meta?: Record<string, unknown>;
  }
  | {
    ok: false;
    success: false;
    error: ServiceError;
    message: string;
    errorCode?: string;
  };

export interface BaseEntity {
  id: string;
  school_id: string;
  created_at: Date;
  updated_at?: Date;
  created_by?: string;
}

export class ControlledError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(code: string, message: string, status = 400, details?: unknown) {
    super(message);
    this.name = "ControlledError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
