import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "../base";

const examViolationSchema = new Schema(
  {
    school_id: tenantField,
    exam_id: { type: Types.ObjectId, ref: "LiveExam", index: true },
    student_id: { type: Types.ObjectId, ref: "Student", index: true },
    violation_type: {
      type: String,
      enum: ["tab_switch", "fullscreen_exit", "copy_paste", "right_click", "multiple_refreshes", "other"],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    details: { type: String, default: "" }
  },
  { ...schemaOptions, collection: "exam_violations" }
);

export const ExamViolationModel = models.ExamViolation || model("ExamViolation", examViolationSchema);
