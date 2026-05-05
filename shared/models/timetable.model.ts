import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField, requiredString } from "./base";

const timetableSchema = new Schema(
  {
    school_id: tenantField,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    subject_id: { type: Types.ObjectId, ref: "Subject", index: true },
    subject: requiredString,
    day_of_week: { type: Number, min: 1, max: 7, index: true },
    day: {
      type: String,
      required: true,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      index: true,
    },
    period_number: { type: Number, min: 1, default: 1 },
    start_time: requiredString,
    end_time: requiredString,
    room: { type: String, trim: true, default: "" },
  },
  { ...schemaOptions, collection: "timetable" }
);

timetableSchema.index({ school_id: 1, class_id: 1, day: 1, start_time: 1, end_time: 1 });
timetableSchema.index({ school_id: 1, teacher_id: 1, day: 1, start_time: 1, end_time: 1 });

if (models.Timetable) {
  delete (models as any).Timetable;
}

export const TimetableModel = model("Timetable", timetableSchema);
