import { Schema, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const academicYearSchema = new Schema(
  {
    school_id: tenantField,
    year: requiredString,
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false, index: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "active", "completed", "cancelled"],
      default: "draft",
      index: true
    }
  },
  { ...schemaOptions, collection: "academic_years" }
);

academicYearSchema.index({ school_id: 1, year: 1 }, { unique: true });
academicYearSchema.index({ school_id: 1, is_active: 1, status: 1 });

export const AcademicYearModel = models.AcademicYear || model("AcademicYear", academicYearSchema);
