import mongoose, { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const announcementSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: {
      type: Types.ObjectId,
      ref: "AcademicYear",
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
announcementSchema.index({ school_id: 1, academic_year_id: 1, created_at: -1 });

export interface AnnouncementModel {
  title: string;
  message: string;
  created_by: string;
}

if (models.Announcement) {
  delete (models as any).Announcement;
}
export const AnnouncementDocModel = model("Announcement", announcementSchema);
export type AnnouncementModelDoc = mongoose.HydratedDocument<AnnouncementModel & mongoose.Document>;
