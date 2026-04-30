import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const attendanceSchema = new Schema(
  {
    school_id: tenantField,
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
      index: true
    },
    marked_by: { type: Types.ObjectId, ref: "User", required: true },
    source: {
      type: String,
      enum: ["manual", "auto", "sync"],
      default: "manual"
    },
    note: String
  },
  { ...schemaOptions, collection: "attendance" }
);

attendanceSchema.index({ school_id: 1, student_id: 1, date: 1 }, { unique: true });
attendanceSchema.index({ school_id: 1, class_id: 1, date: 1 });
attendanceSchema.index({ school_id: 1, status: 1, date: -1 });

export const AttendanceModel = models.Attendance || model("Attendance", attendanceSchema);
