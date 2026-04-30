import { Schema, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const schoolSchema = new Schema(
  {
    school_id: { ...tenantField, index: false },
    name: requiredString,
    code: { ...requiredString, uppercase: true },
    logo_url: { type: String, trim: true, default: "" },
    contact_email: { type: String, trim: true, lowercase: true, default: "" },
    contact_phone: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    established_year: { type: Number },
    admin_profile: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" }
    },
    domains: [{ type: String, trim: true, lowercase: true }],
    status: {
      type: String,
      enum: ["active", "suspended", "blocked"],
      default: "active",
      index: true
    },
    plan: {
      key: { type: String, default: "starter" },
      seats: { type: Number, default: 0 },
      expires_at: Date
    },
    usage: {
      users: { type: Number, default: 0 },
      students: { type: Number, default: 0 },
      storage_mb: { type: Number, default: 0 }
    },
    settings: {
      timezone: { type: String, default: "UTC" },
      academic_year: String,
      attendance_threshold: { type: Number, default: 70 }
    },
    created_by: String,
    updated_by: String
  },
  { ...schemaOptions, collection: "schools" }
);

schoolSchema.index({ school_id: 1 }, { unique: true });
schoolSchema.index({ code: 1 }, { unique: true });
schoolSchema.index({ status: 1, "plan.key": 1 });

export const SchoolModel = models.School || model("School", schoolSchema);
