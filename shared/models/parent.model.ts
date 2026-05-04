import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const parentSchema = new Schema(
  {
    school_id: tenantField,
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    }
  },
  { ...schemaOptions, collection: "parents" }
);

parentSchema.index({ school_id: 1, user_id: 1, student_id: 1 }, { unique: true });

export const ParentModel = models.Parent || model("Parent", parentSchema);
