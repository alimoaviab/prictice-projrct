import { Schema, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const auditLogSchema = new Schema(
  {
    school_id: tenantField,
    actor_user_id: { type: String, required: true, index: true },
    actor_role: { type: String, required: true },
    actor_email: String,
    action: { type: String, required: true, index: true },
    entity_type: { type: String, required: true, index: true },
    entity_id: { type: String, required: true, index: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    metadata: Schema.Types.Mixed,
    ip: String,
    user_agent: String
  },
  { ...schemaOptions, collection: "audit_logs" }
);

auditLogSchema.index({ school_id: 1, created_at: -1 });
auditLogSchema.index({ school_id: 1, entity_type: 1, entity_id: 1, created_at: -1 });
auditLogSchema.index({ school_id: 1, actor_user_id: 1, created_at: -1 });
auditLogSchema.index({ action: 1, created_at: -1 });

export const AuditLogModel = models.AuditLog || model("AuditLog", auditLogSchema);
