import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const homeworkSchema = new Schema(
  {
    school_id: tenantField,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    subject: requiredString,
    title: requiredString,
    instructions: String,
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
        grade: Number,
        feedback: String
      }
    ]
  },
  { ...schemaOptions, collection: "homework" }
);

homeworkSchema.index({ school_id: 1, class_id: 1, due_at: 1 });
homeworkSchema.index({ school_id: 1, teacher_id: 1, created_at: -1 });
homeworkSchema.index({ school_id: 1, "submissions.student_id": 1 });

export const HomeworkModel = models.Homework || model("Homework", homeworkSchema);
