import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const studentSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    user_id: { type: Types.ObjectId, ref: "User", index: true },
    admission_no: requiredString,
    first_name: requiredString,
    last_name: requiredString,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    subjects: [{ type: String, trim: true }],
    section: { type: String, required: true, trim: true },
    guardian: {
      name: requiredString,
      phone: requiredString,
      email: { type: String, trim: true, lowercase: true }
    },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
      index: true
    },
    enrolled_at: { type: Date, default: Date.now }
  },
  { ...schemaOptions, collection: "students" }
);

studentSchema.index({ school_id: 1, admission_no: 1 }, { unique: true });
studentSchema.index({ school_id: 1, class_id: 1, section: 1, status: 1 });
studentSchema.index({ school_id: 1, user_id: 1 }, { sparse: true });
// Pagination + sort: school_id + academic_year_id + status with name sort key
studentSchema.index({ school_id: 1, academic_year_id: 1, status: 1, last_name: 1, first_name: 1 });
// Search-friendly: most search inputs filter by school + academic year then match name/email
studentSchema.index({ school_id: 1, academic_year_id: 1, last_name: 1 });
studentSchema.index({ school_id: 1, academic_year_id: 1, first_name: 1 });

export const StudentModel = models.Student || model("Student", studentSchema);
