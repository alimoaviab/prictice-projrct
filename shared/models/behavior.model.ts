import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const behaviorSchema = new Schema(
  {
    school_id: tenantField,
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    title: requiredString,
    description: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true
    },
    date: { type: Date, required: true, index: true }
  },
  { ...schemaOptions, collection: "behavior" }
);

behaviorSchema.index({ school_id: 1, student_id: 1 });
behaviorSchema.index({ school_id: 1, teacher_id: 1, date: -1 });

export const BehaviorModel = models.Behavior || model("Behavior", behaviorSchema);
