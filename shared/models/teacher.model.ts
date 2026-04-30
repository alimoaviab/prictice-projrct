import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const teacherSchema = new Schema(
  {
    school_id: tenantField,
    user_id: { type: Types.ObjectId, ref: "User", index: true },
    employee_no: requiredString,
    first_name: requiredString,
    last_name: requiredString,
    subjects: [{ type: String, trim: true }],
    class_ids: [{ type: Types.ObjectId, ref: "Class" }],
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave"],
      default: "active",
      index: true
    },
    joined_at: { type: Date, default: Date.now }
  },
  { ...schemaOptions, collection: "teachers" }
);

teacherSchema.index({ school_id: 1, employee_no: 1 }, { unique: true });
teacherSchema.index({ school_id: 1, user_id: 1 }, { sparse: true });
teacherSchema.index({ school_id: 1, subjects: 1, status: 1 });

export const TeacherModel = models.Teacher || model("Teacher", teacherSchema);
