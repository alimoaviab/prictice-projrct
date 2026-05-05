import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const feeAdjustmentSchema = new Schema(
    {
        school_id: tenantField,
        student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
        academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
        type: {
            type: String,
            enum: ["discount", "waiver", "penalty", "scholarship"],
            required: true,
            index: true
        },
        amount: { type: Number, required: true, min: 0 },
        reason: { type: String, trim: true, required: true },
        valid_from: { type: Date, required: true, index: true },
        valid_until: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: ["active", "expired", "pending"],
            default: "active",
            index: true
        },
        applied_by: { type: Types.ObjectId, ref: "User" }
    },
    { ...schemaOptions, collection: "fee_adjustments" }
);

feeAdjustmentSchema.index({ school_id: 1, student_id: 1, academic_year_id: 1, type: 1 });

export const FeeAdjustmentModel = models.FeeAdjustment || model("FeeAdjustment", feeAdjustmentSchema);