export type Role = "super_admin" | "admin" | "teacher" | "student";

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
  | "fee"
  | "notification"
  | "sync_job";

export type PermissionAction = "view" | "create" | "update" | "delete" | "manage";

export type Feature =
  | "schools"
  | "users"
  | "students"
  | "teachers"
  | "classes"
  | "attendance"
  | "homework"
  | "exams"
  | "fees"
  | "reports"
  | "notifications"
  | "audit_logs"
  | "platform";

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
  | { ok: true; data: T; meta?: Record<string, unknown> }
  | { ok: false; error: ServiceError };

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
