import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const classSchema = new Schema(
  {
    school_id: tenantField,
    name: requiredString,
    code: { type: String, trim: true, default: "" },
    display_order: { type: Number, default: 1 },
    passing_percentage: { type: Number, default: 33 },
    capacity: { type: Number, min: 0, default: 0 },
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    subject_ids: [{ type: Types.ObjectId, ref: "Subject", index: true }],
    subjects: [
      {
        name: { type: String, trim: true },
        total_marks: { type: Number, default: 100 },
        passing_marks: { type: Number, default: 33 },
        teacher_id: { type: Types.ObjectId, ref: "Teacher" },
        starts_at: { type: String, trim: true, default: "" },
        ends_at: { type: String, trim: true, default: "" },
        day_of_week: { type: Number, default: 1 },
        timetable: { type: String, trim: true, default: "" }
      }
    ],
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
  { school_id: 1, name: 1, academic_year_id: 1 },
  { unique: true }
);
classSchema.index({ school_id: 1, teacher_ids: 1 });
classSchema.index({ school_id: 1, class_teacher_id: 1 });

export const ClassModel = models.Class || model("Class", classSchema);
