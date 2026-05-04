import { ControlledError, Feature, PermissionAction, RequestContext, Role } from "../types/core";

type RoleAccess = Partial<Record<Feature, PermissionAction[]>>;

export const roleAccessMatrix: Record<Role, RoleAccess> = {
  super_admin: {
    platform: ["manage"],
    schools: ["view", "create", "update", "delete", "manage"],
    audit_logs: ["view"],
    reports: ["view"]
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
    events: ["view", "create", "update", "delete", "manage"]
  },
  teacher: {
    settings: ["view"],
    teachers: ["view"],
    subjects: ["view"],
    classes: ["view"],
    attendance: ["view", "create", "update"],
    homework: ["view", "create", "update"],
    exams: ["view", "create", "update"],
    results: ["view", "create", "update"],
    reports: ["view"],
    notifications: ["view"],
    announcements: ["view"],
    timetable: ["view"],
    behavior: ["view", "create", "update"],
    leave: ["view", "create"],
    events: ["view"]
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
    events: ["view"]
  }
};

export function canAccess(role: Role, feature: Feature, action: PermissionAction): boolean {
  const allowed = roleAccessMatrix[role][feature] ?? [];
  return allowed.includes(action) || allowed.includes("manage");
}

export function assertPermission(
  ctx: RequestContext,
  feature: Feature,
  action: PermissionAction
): void {
  const explicit = ctx.permissions.includes(`${feature}:${action}`) || ctx.permissions.includes(`${feature}:manage`);
  if (!explicit && !canAccess(ctx.role, feature, action)) {
    throw new ControlledError("FORBIDDEN", "You do not have permission to perform this action.", 403, {
      feature,
      action
    });
  }
}
