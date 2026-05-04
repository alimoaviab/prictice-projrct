import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField, requiredString } from "./base";

const eventSchema = new Schema(
  {
    school_id: tenantField,
    title: requiredString,
    description: String,
    event_type: {
      type: String,
      enum: ["academic", "holiday", "sports", "cultural", "other"],
      default: "other",
    },
    start_date: { type: Date, required: true, index: true },
    end_date: { type: Date, required: true, index: true },
    start_time: String,
    end_time: String,
    location: String,
    visibility: {
      type: String,
      enum: ["all", "specific_classes"],
      default: "all",
    },
    target_class_ids: [{ type: Types.ObjectId, ref: "Class" }],
    organizer: String,
    status: {
      type: String,
      enum: ["scheduled", "cancelled", "completed"],
      default: "scheduled",
    },
    created_by: { type: Types.ObjectId, ref: "User", required: true },
  },
  { ...schemaOptions, collection: "events" }
);

eventSchema.index({ school_id: 1, start_date: 1 });

export const EventModel = models.Event || model("Event", eventSchema);
