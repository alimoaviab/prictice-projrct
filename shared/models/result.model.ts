import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const resultSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    exam_id: { type: Types.ObjectId, ref: "Exam", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    obtained_marks: { type: Number, required: true },
    grade: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    graded_at: { type: Date, default: Date.now }
  },
  { ...schemaOptions, collection: "results" }
);

resultSchema.index({ school_id: 1, academic_year_id: 1, exam_id: 1, student_id: 1 }, { unique: true });
resultSchema.index({ school_id: 1, academic_year_id: 1, class_id: 1, graded_at: -1 });

export const ResultModel = models.Result || model("Result", resultSchema);