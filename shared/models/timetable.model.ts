import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField, requiredString } from "./base";

const timetableSchema = new Schema(
  {
    school_id: tenantField,
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    teacher_id: { type: Types.ObjectId, ref: "Teacher", required: true, index: true },
    subject: requiredString,
    day: {
      type: String,
      required: true,
      enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      index: true,
    },
    start_time: requiredString,
    end_time: requiredString,
  },
  { ...schemaOptions, collection: "timetable" }
);

timetableSchema.index({ school_id: 1, class_id: 1, day: 1 });
timetableSchema.index({ school_id: 1, teacher_id: 1, day: 1 });

export const TimetableModel = models.Timetable || model("Timetable", timetableSchema);
