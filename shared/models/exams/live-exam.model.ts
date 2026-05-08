import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField, requiredString } from "../base";

const liveExamSchema = new Schema(
  {
    school_id: tenantField,
    title: requiredString,
    class_id: { type: Types.ObjectId, ref: "Class", index: true },
    section_id: { type: Types.ObjectId, ref: "Class" }, // Using Class for section/grouping if needed
    subject_id: { type: Types.ObjectId, ref: "Subject", index: true },
    duration: { type: Number, required: true }, // in minutes
    total_marks: { type: Number, required: true },
    passing_marks: { type: Number, default: 0 },
    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "completed", "cancelled", "results_published"],
      default: "draft",
      index: true
    },
    questions: [{ type: Types.ObjectId, ref: "ExamQuestion" }],
    created_by: { type: Types.ObjectId, ref: "User" },
    randomize_questions: { type: Boolean, default: false },
    randomize_options: { type: Boolean, default: false }
  },
  { ...schemaOptions, collection: "live_exams" }
);

liveExamSchema.index({ school_id: 1, class_id: 1, start_time: 1 });
liveExamSchema.index({ school_id: 1, status: 1 });

export const LiveExamModel = models.LiveExam || model("LiveExam", liveExamSchema);
