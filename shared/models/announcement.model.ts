import mongoose, { Schema, Types, model, models } from "mongoose";
import { schemaOptions } from "./base";

const announcementSchema = new Schema(
  {
    school_id: {
      type: Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    created_by: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { ...schemaOptions, timestamps: true, collection: "announcements" }
);

announcementSchema.index({ school_id: 1, created_at: -1 });

export interface AnnouncementModel {
  title: string;
  message: string;
  created_by: string;
}

export const AnnouncementDocModel = models.Announcement || model("Announcement", announcementSchema);
export type AnnouncementModelDoc = mongoose.HydratedDocument<AnnouncementModel & mongoose.Document>;
