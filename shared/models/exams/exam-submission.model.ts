import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "../base";

const examSubmissionSchema = new Schema(
  {
    school_id: tenantField,
    exam_id: { type: Types.ObjectId, ref: "LiveExam", index: true },
    student_id: { type: Types.ObjectId, ref: "Student", index: true },
    answers: [
      {
        question_id: { type: Types.ObjectId, ref: "ExamQuestion" },
        answer: { type: Schema.Types.Mixed },
        marks_obtained: { type: Number, default: null }, // Null means pending evaluation
        is_correct: { type: Boolean, default: null }
      }
    ],
    status: {
      type: String,
      enum: ["in_progress", "submitted", "auto_submitted", "evaluated"],
      default: "in_progress"
    },
    start_time: { type: Date, required: true },
    end_time: { type: Date }, // Time of actual submission
    remaining_time: { type: Number }, // in seconds, useful for auto-save
    total_marks_obtained: { type: Number, default: 0 },
    auto_submitted: { type: Boolean, default: false },
    suspicious_activities: { type: Number, default: 0 }
  },
  { ...schemaOptions, collection: "exam_submissions" }
);

examSubmissionSchema.index({ school_id: 1, exam_id: 1, student_id: 1 }, { unique: true });

export const ExamSubmissionModel = models.ExamSubmission || model("ExamSubmission", examSubmissionSchema);
