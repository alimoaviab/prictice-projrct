import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const homeworkSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    subject_id: { type: Types.ObjectId, ref: "Subject", required: true, index: true },
    subject: { type: String, trim: true, default: "" }, // Backward compatibility
    title: requiredString,
    instructions: String,
    attachment_urls: [{ type: String, trim: true }],
    max_score: { type: Number, default: 100, min: 0 },
    submission_type: {
      type: String,
      enum: ["online", "offline", "both"],
      default: "both"
    },
    assigned_at: { type: Date, default: Date.now, index: true },
    due_at: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "assigned", "closed"],
      default: "assigned",
      index: true
    },
    submissions: [
      {
        student_id: { type: Types.ObjectId, ref: "Student" },
        submitted_at: Date,
        status: {
          type: String,
          enum: ["pending", "submitted", "late", "missing"],
          default: "pending"
        },
        attachment_urls: [{ type: String, trim: true }],
        grade: Number,
        feedback: String
      }
    ]
  },
  { ...schemaOptions, collection: "homework" }
);

homeworkSchema.index({ school_id: 1, academic_year_id: 1, class_id: 1, due_at: 1 });
homeworkSchema.index({ school_id: 1, academic_year_id: 1, teacher_id: 1, created_at: -1 });
homeworkSchema.index({ school_id: 1, academic_year_id: 1, "submissions.student_id": 1 });
homeworkSchema.index({ school_id: 1, academic_year_id: 1, assigned_at: -1 });

export const HomeworkModel = models.Homework || model("Homework", homeworkSchema);
