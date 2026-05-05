import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const classSchema = new Schema(
  {
    school_id: tenantField,
    name: requiredString,
    capacity: { type: Number, min: 0, default: 0 },
    academy_care_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    subject_ids: [{ type: Types.ObjectId, ref: "Subject", index: true }],
    subjects: [{ type: String, trim: true }], // Keep for backward compatibility, will be deprecated
    grade: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    academic_year: { type: String, trim: true, default: "" },
    class_teacher_id: { type: Types.ObjectId, ref: "Teacher", index: true },
    teacher_ids: [{ type: Types.ObjectId, ref: "Teacher" }],
    room_number: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    fee_structure: {
      total_annual: { type: Number, default: 0 },
      monthly_recurring: { type: Number, default: 0 },
      fees_configured: { type: Boolean, default: false }
    },
    grade_thresholds: {
      type: Schema.Types.Mixed,
      default: {}
    },
    timetable: [
      {
        day: String,
        period: Number,
        subject_id: { type: Types.ObjectId, ref: "Subject" },
        subject: String, // Keep for backward compatibility
        teacher_id: { type: Types.ObjectId, ref: "Teacher" },
        starts_at: String,
        ends_at: String
      }
    ],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true
    }
  },
  { ...schemaOptions, collection: "classes" }
);

classSchema.index(
  { school_id: 1, name: 1, academy_care_id: 1 },
  { unique: true }
);
classSchema.index({ school_id: 1, teacher_ids: 1 });
classSchema.index({ school_id: 1, class_teacher_id: 1 });

export const ClassModel = models.Class || model("Class", classSchema);
