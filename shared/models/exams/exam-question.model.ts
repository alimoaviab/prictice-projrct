import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "../base";

const examQuestionSchema = new Schema(
  {
    school_id: tenantField,
    exam_id: { type: Types.ObjectId, ref: "LiveExam", index: true },
    type: {
      type: String,
      enum: ["mcq", "true_false", "short_answer", "long_answer", "fill_blanks", "file_upload"],
      required: true
    },
    question_text: { type: String, required: true },
    options: [{ type: String }], // For MCQs
    correct_answer: { type: Schema.Types.Mixed }, // String or Array depending on type
    marks: { type: Number, required: true },
    negative_marks: { type: Number, default: 0 },
    explanation: { type: String, default: "" }
  },
  { ...schemaOptions, collection: "exam_questions" }
);

export const ExamQuestionModel = models.ExamQuestion || model("ExamQuestion", examQuestionSchema);
