import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const subjectSchema = new Schema(
    {
        school_id: tenantField,
        name: requiredString,
        code: { type: String, trim: true },
        description: { type: String, trim: true },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        }
    },
    { ...schemaOptions, collection: "subjects" }
);

subjectSchema.index({ school_id: 1, name: 1 }, { unique: true });
subjectSchema.index({ school_id: 1, status: 1 });

export const SubjectModel = models.Subject || model("Subject", subjectSchema);