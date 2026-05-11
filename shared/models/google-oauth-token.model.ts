import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const googleOauthTokenSchema = new Schema(
  {
    school_id: tenantField,
    user_id: { type: Types.ObjectId, ref: "User", required: true, index: true },
    user_email: { type: String, trim: true, lowercase: true, default: "", index: true },
    provider: { type: String, trim: true, default: "google", index: true },
    access_token_enc: { type: String, required: true },
    refresh_token_enc: { type: String, default: "" },
    expires_at: { type: Date, index: true },
    scope: { type: String, trim: true, default: "" },
    token_type: { type: String, trim: true, default: "Bearer" },
    last_refreshed_at: { type: Date },
    last_error: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["active", "revoked", "invalid"],
      default: "active",
      index: true
    }
  },
  { ...schemaOptions, collection: "google_oauth_tokens" }
);

googleOauthTokenSchema.index({ school_id: 1, user_id: 1, provider: 1 }, { unique: true });

export const GoogleOauthTokenModel =
  (models.GoogleOauthToken as any) ||
  model("GoogleOauthToken", googleOauthTokenSchema);
