import { Schema, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const userSchema = new Schema(
  {
    school_id: tenantField,
    email: { ...requiredString, lowercase: true },
    password_hash: requiredString,
    role: {
      type: String,
      enum: ["super_admin", "admin", "teacher", "parent"],
      required: true,
      index: true
    },
    permissions: [{ type: String, trim: true }],
    profile: {
      first_name: String,
      last_name: String,
      phone: String,
      avatar_url: String
    },
    status: {
      type: String,
      enum: ["active", "invited", "disabled", "locked"],
      default: "active",
      index: true
    },
    last_login_at: Date
  },
  { ...schemaOptions, collection: "users" }
);

userSchema.index({ school_id: 1, email: 1 }, { unique: true });
userSchema.index({ school_id: 1, role: 1, status: 1 });

export const UserModel = models.User || model("User", userSchema);
