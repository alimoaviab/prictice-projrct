import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const examSchema = new Schema(
  {
    school_id: tenantField,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    subject: requiredString,
    title: requiredString,
    starts_at: { type: Date, required: true, index: true },
    max_marks: { type: Number, required: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
      index: true
    },
    marks: [
      {
        student_id: { type: Types.ObjectId, ref: "Student" },
        marks_obtained: Number,
        graded_by: { type: Types.ObjectId, ref: "Teacher" },
        graded_at: Date
      }
    ]
  },
  { ...schemaOptions, collection: "exams" }
);

examSchema.index({ school_id: 1, class_id: 1, starts_at: 1 });
examSchema.index({ school_id: 1, subject: 1, starts_at: -1 });
examSchema.index({ school_id: 1, "marks.student_id": 1 });

export const ExamModel = models.Exam || model("Exam", examSchema);
