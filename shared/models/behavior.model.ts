import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const behaviorSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true },
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    incident_type: {
      type: String,
      enum: ["attendance", "conduct", "academic_dishonesty", "bullying", "vandalism", "other"],
      required: true
    },
    description: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["minor", "moderate", "major", "critical"],
      required: true
    },
    action_taken: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "escalated"],
      default: "open"
    },
    warning_count: { type: Number, default: 1 },
    parent_notified: { type: Boolean, default: false },
    notes: { type: String, trim: true }
  },
  { ...schemaOptions, collection: "behavior" }
);

behaviorSchema.index({ school_id: 1, student_id: 1 });
behaviorSchema.index({ school_id: 1, teacher_id: 1, created_at: -1 });
behaviorSchema.index({ school_id: 1, academic_year_id: 1, created_at: -1 });

export const BehaviorModel = models.Behavior || model("Behavior", behaviorSchema);
