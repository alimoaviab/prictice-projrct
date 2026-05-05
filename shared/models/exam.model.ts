import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const examSchema = new Schema(
  {
    school_id: tenantField,
    name: { type: String, trim: true, default: "" },
    exam_type: { type: String, trim: true, default: "written", index: true },
    class_id: { type: Types.ObjectId, ref: "Class", index: true },
    class_ids: [{ type: Types.ObjectId, ref: "Class", index: true }],
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true },
    subject: { type: String, trim: true, default: "" },
    title: requiredString,
    starts_at: { type: Date, index: true },
    exam_date: { type: Date, index: true },
    max_marks: { type: Number, required: true },
    pass_marks: { type: Number, default: 0 },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["created", "scheduled", "published", "results_published", "completed", "cancelled"],
      default: "created",
      index: true
    },
    published_at: { type: Date },
    results_published_at: { type: Date },
    schedule: [
      {
        subject_id: { type: Types.ObjectId, ref: "Subject" },
        class_id: { type: Types.ObjectId, ref: "Class" },
        date: { type: Date },
        start_time: { type: String, trim: true },
        end_time: { type: String, trim: true },
        hall: { type: String, trim: true, default: "" }
      }
    ],
    marks: [
      {
        student_id: { type: Types.ObjectId, ref: "Student" },
        subject_id: { type: Types.ObjectId, ref: "Subject" },
        marks_obtained: Number,
        graded_by: { type: Types.ObjectId, ref: "Teacher" },
        graded_at: Date
      }
    ]
  },
  { ...schemaOptions, collection: "exams" }
);

examSchema.index({ school_id: 1, class_id: 1, exam_date: 1 });
examSchema.index({ school_id: 1, class_ids: 1, exam_date: 1 });
examSchema.index({ school_id: 1, subject: 1, exam_date: -1 });
examSchema.index({ school_id: 1, "marks.student_id": 1 });

export const ExamModel = models.Exam || model("Exam", examSchema);
