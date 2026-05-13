import mongoose, { Schema, Document } from "mongoose";
import { tenantField, schemaOptions, requiredString } from "../base";

export interface ILiveClass extends Document {
  school_id: string;
  academic_year_id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  teacherId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  sectionId?: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  meetingLink?: string;
  meetingProvider: 'google_meet' | 'zoom' | 'manual';
  googleCalendarEventId?: string;
  meetingStatus: 'scheduled' | 'started' | 'ended' | 'cancelled';
  timezone: string;
  startTime: Date;
  endTime: Date;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED";
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LiveClassSchema = new Schema(
  {
    school_id: tenantField,
    academic_year_id: { type: Schema.Types.ObjectId, ref: "AcademicYear", index: true },
    title: requiredString,
    description: { type: String, default: "" },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: "Section" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    meetingLink: { type: String },
    meetingProvider: {
      type: String,
      enum: ['google_meet', 'zoom', 'manual'],
      default: 'google_meet'
    },
    googleCalendarEventId: { type: String },
    meetingStatus: {
      type: String,
      enum: ['scheduled', 'started', 'ended', 'cancelled'],
      default: 'scheduled'
    },
    timezone: { type: String, default: 'UTC' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "LIVE", "COMPLETED", "CANCELLED"],
      default: "SCHEDULED",
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  schemaOptions
);

LiveClassSchema.index({ school_id: 1, classId: 1, startTime: 1 });
LiveClassSchema.index({ school_id: 1, teacherId: 1, status: 1 });
LiveClassSchema.index({ school_id: 1, meetingProvider: 1, meetingStatus: 1 });
LiveClassSchema.index({ school_id: 1, academic_year_id: 1, startTime: 1 });

export const LiveClass = mongoose.models.LiveClass || mongoose.model<ILiveClass>("LiveClass", LiveClassSchema);
