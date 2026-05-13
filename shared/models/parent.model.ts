import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

/**
 * MULTI-CHILD PARENT SYSTEM
 * 
 * This model creates a many-to-many relationship between parents and students.
 * One parent can have multiple children, and one student can have multiple guardians.
 * 
 * Architecture:
 * - Parent User (users table with role="parent")
 * - Parent-Student Links (this table)
 * - Students (students table)
 */
const parentSchema = new Schema(
  {
    school_id: tenantField,
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    relationship: {
      type: String,
      enum: ["father", "mother", "guardian", "other"],
      default: "guardian"
    },
    is_primary: {
      type: Boolean,
      default: true,
      index: true
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    }
  },
  { ...schemaOptions, collection: "parents" }
);

// Unique constraint: one parent-student link per school
parentSchema.index({ school_id: 1, user_id: 1, student_id: 1 }, { unique: true });

// Query optimization indexes
parentSchema.index({ school_id: 1, user_id: 1, status: 1 });
parentSchema.index({ school_id: 1, student_id: 1, status: 1 });

export const ParentModel = models.Parent || model("Parent", parentSchema);
