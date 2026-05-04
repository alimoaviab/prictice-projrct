import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const timetableSchema = new Schema(
  {
    school_id: tenantField,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    subject_id: { type: Types.ObjectId, ref: "Subject", required: true, index: true },
    day_of_week: {
      type: Number,
      required: true,
      min: 0, // 0 = Everyday, 1-7 = Monday-Sunday
      max: 7,
      index: true
    },
    period_number: {
      type: Number,
      required: true,
      min: 1,
      index: true
    },
    start_time: requiredString,
    end_time: requiredString,
    room: { type: String, trim: true },
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true }
  },
  { ...schemaOptions, collection: "timetable" }
);

timetableSchema.index({ school_id: 1, class_id: 1, day_of_week: 1, period_number: 1 }, { unique: true });
timetableSchema.index({ school_id: 1, teacher_id: 1, day_of_week: 1, period_number: 1 });
timetableSchema.index({ school_id: 1, academic_year_id: 1, class_id: 1 });

export const TimetableModel = models.Timetable || model("Timetable", timetableSchema);
