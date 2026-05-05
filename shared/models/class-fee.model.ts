import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const classFeeSchema = new Schema(
    {
        school_id: tenantField,
        class_id: { type: Types.ObjectId, ref: "Class", required: true, index: true },
        academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", required: true, index: true },
        fee_type_id: { type: Types.ObjectId, ref: "FeeType", required: true, index: true },
        amount: { type: Number, required: true, min: 0 },
        due_date: { type: Date, required: true, index: true },
        is_monthly: { type: Boolean, default: true, index: true },
        notes: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["active", "inactive"], default: "active", index: true }
    },
    { ...schemaOptions, collection: "class_fees" }
);

classFeeSchema.index({ school_id: 1, class_id: 1, academic_year_id: 1, fee_type_id: 1 }, { unique: true });

export const ClassFeeModel = models.ClassFee || model("ClassFee", classFeeSchema);