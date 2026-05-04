import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const classSchema = new Schema(
  {
    school_id: tenantField,
    name: requiredString,
    academy_care_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
    subject_ids: [{ type: Types.ObjectId, ref: "Subject", index: true }],
    subjects: [{ type: String, trim: true }], // Keep for backward compatibility, will be deprecated
    grade: { type: String, trim: true, default: "" },
    section: { type: String, trim: true, default: "" },
    academic_year: { type: String, trim: true, default: "" },
    teacher_ids: [{ type: Types.ObjectId, ref: "Teacher" }],
    room_number: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    timetable: [
      {
        day: String,
        period: Number,
        subject_id: { type: Types.ObjectId, ref: "Subject" },
        subject: String, // Keep for backward compatibility
        teacher_id: { type: Types.ObjectId, ref: "Teacher" },
        starts_at: String,
        ends_at: String
      }
    ],
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true
    }
  },
  { ...schemaOptions, collection: "classes" }
);

classSchema.index(
  { school_id: 1, name: 1, academy_care_id: 1 },
  { unique: true }
);
classSchema.index({ school_id: 1, teacher_ids: 1 });

export const ClassModel = models.Class || model("Class", classSchema);
