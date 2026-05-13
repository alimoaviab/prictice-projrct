import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField, requiredString } from "./base";

const leaveSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true },
    requester_type: {
      type: String,
      required: true,
      enum: ["student", "teacher"],
    },
    requester_id: { type: Types.ObjectId, required: true, index: true },
    requester_name: String,
    leave_type: {
      type: String,
      required: true,
      enum: ["sick", "personal", "family", "other"],
    },
    reason: requiredString,
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    approved_by: { type: Types.ObjectId, ref: "User" },
    approved_at: Date,
    rejection_reason: String,
    attachments: [{ type: String }],
  },
  { ...schemaOptions, collection: "leaves" }
);

leaveSchema.index({ school_id: 1, requester_id: 1, start_date: -1 });
leaveSchema.index({ school_id: 1, academic_year_id: 1, status: 1 });

export const LeaveModel = models.Leave || model("Leave", leaveSchema);
