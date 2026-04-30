import { AuditAction, EntityType, RequestContext } from "../types/core";
import { AuditLogModel } from "../models/audit-log.model";

export interface AuditInput {
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(ctx: RequestContext, input: AuditInput): Promise<void> {
  await AuditLogModel.create({
    school_id: ctx.school_id,
    actor_user_id: ctx.user_id,
    actor_role: ctx.role,
    actor_email: ctx.actor_email,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    before: input.before,
    after: input.after,
    metadata: input.metadata,
    ip: ctx.ip,
    user_agent: ctx.user_agent
  });
}
