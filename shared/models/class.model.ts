import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const classSchema = new Schema(
  {
    school_id: tenantField,
    grade: requiredString,
    section: requiredString,
    academic_year: requiredString,
    teacher_ids: [{ type: Types.ObjectId, ref: "Teacher" }],
    timetable: [
      {
        day: String,
        period: Number,
        subject: String,
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
  { school_id: 1, grade: 1, section: 1, academic_year: 1 },
  { unique: true }
);
classSchema.index({ school_id: 1, teacher_ids: 1 });

export const ClassModel = models.Class || model("Class", classSchema);
