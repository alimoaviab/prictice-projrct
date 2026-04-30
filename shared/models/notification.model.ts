import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const notificationSchema = new Schema(
  {
    school_id: tenantField,
    recipient_user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    title: requiredString,
    body: requiredString,
    trigger: {
      type: String,
      enum: ["homework_assigned", "test_scheduled", "fee_due", "attendance_warning", "low_marks"],
      required: true,
      index: true
    },
    entity_type: String,
    entity_id: String,
    read_at: Date,
    delivery: {
      status: {
        type: String,
        enum: ["queued", "sent", "failed"],
        default: "queued"
      },
      attempts: { type: Number, default: 0 },
      last_error: String
    }
  },
  { ...schemaOptions, collection: "notifications" }
);

notificationSchema.index({ school_id: 1, recipient_user_id: 1, read_at: 1, created_at: -1 });
notificationSchema.index({ school_id: 1, trigger: 1, created_at: -1 });

export const NotificationModel =
  models.Notification || model("Notification", notificationSchema);
