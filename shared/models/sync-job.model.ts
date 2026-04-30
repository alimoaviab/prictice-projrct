import { Schema, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const syncJobSchema = new Schema(
  {
    school_id: tenantField,
    idempotency_key: requiredString,
    type: requiredString,
    payload: Schema.Types.Mixed,
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true
    },
    attempts: { type: Number, default: 0 },
    max_attempts: { type: Number, default: 8 },
    next_run_at: { type: Date, default: Date.now, index: true },
    last_error: String
  },
  { ...schemaOptions, collection: "sync_jobs" }
);

syncJobSchema.index({ school_id: 1, idempotency_key: 1 }, { unique: true });
syncJobSchema.index({ school_id: 1, status: 1, next_run_at: 1 });

export const SyncJobModel = models.SyncJob || model("SyncJob", syncJobSchema);
