/**
 * RBAC matrix ported 1:1 from old-app/shared/auth/rbac.ts.
 *
 * The frontend uses this to gate sidebar items and to decide whether to render
 * action buttons. The backend (current Node, future Go) re-validates permissions
 * on every request — this is purely a UX optimisation.
 */

import type { Feature, PermissionAction, Role } from "@/types/core";

type RoleAccess = Partial<Record<Feature, PermissionAction[]>>;

export const roleAccessMatrix: Record<Role, RoleAccess> = {
  super_admin: {
    platform: ["manage"],
    schools: ["view", "create", "update", "delete", "manage"],
    audit_logs: ["view"],
    reports: ["view"],
  },
  admin: {
    users: ["view", "create", "update", "delete", "manage"],
    settings: ["view", "create", "update", "delete", "manage"],
    students: ["view", "create", "update", "delete", "manage"],
    teachers: ["view", "create", "update", "delete", "manage"],
    subjects: ["view", "create", "update", "delete", "manage"],
    classes: ["view", "create", "update", "delete", "manage"],
    attendance: ["view", "create", "update", "delete", "manage"],
    homework: ["view", "create", "update", "delete", "manage"],
    exams: ["view", "create", "update", "delete", "manage"],
    results: ["view", "create", "update", "delete", "manage"],
    fees: ["view", "create", "update", "delete", "manage"],
    reports: ["view"],
    notifications: ["view", "create", "update"],
    audit_logs: ["view"],
    announcements: ["view", "create", "update", "delete", "manage"],
    timetable: ["view", "create", "update", "delete", "manage"],
    behavior: ["view", "create", "update", "delete", "manage"],
    leave: ["view", "create", "update", "delete", "manage"],
    events: ["view", "create", "update", "delete", "manage"],
    schedules: ["view", "create", "update", "delete", "manage"],
  },
  teacher: {
    settings: ["view"],
    students: ["view"],
    teachers: ["view"],
    subjects: ["view"],
    classes: ["view", "create", "update"],
    attendance: ["view", "create", "update"],
    homework: ["view", "create", "update"],
    exams: ["view", "create", "update"],
    results: ["view", "create", "update"],
    fees: ["view"],
    reports: ["view"],
    notifications: ["view"],
    announcements: ["view"],
    timetable: ["view", "create", "update"],
    behavior: ["view", "create", "update"],
    leave: ["view", "create"],
    events: ["view"],
    schedules: ["view", "create", "update", "delete"],
  },
  parent: {
    settings: ["view"],
    subjects: ["view"],
    classes: ["view"],
    attendance: ["view"],
    homework: ["view"],
    exams: ["view"],
    results: ["view"],
    fees: ["view"],
    reports: ["view"],
    notifications: ["view"],
    announcements: ["view"],
    timetable: ["view"],
    behavior: ["view"],
    events: ["view"],
  },
  student: {
    settings: ["view"],
    subjects: ["view"],
    classes: ["view"],
    attendance: ["view"],
    homework: ["view"],
    exams: ["view"],
    results: ["view"],
    fees: ["view"],
    reports: ["view"],
    notifications: ["view"],
    announcements: ["view"],
    timetable: ["view"],
    events: ["view"],
  },
};

export function canAccess(
  role: Role,
  feature: Feature,
  action: PermissionAction
): boolean {
  const allowed = roleAccessMatrix[role][feature] ?? [];
  return allowed.includes(action) || allowed.includes("manage");
}

export function hasPermission(
  permissions: string[] | undefined,
  feature: Feature,
  action: PermissionAction
): boolean {
  if (!permissions || permissions.length === 0) return false;
  return (
    permissions.includes(`${feature}:${action}`) ||
    permissions.includes(`${feature}:manage`)
  );
}
