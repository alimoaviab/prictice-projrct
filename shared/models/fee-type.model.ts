import { Schema, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const feeTypeSchema = new Schema(
    {
        school_id: tenantField,
        name: requiredString,
        description: { type: String, trim: true, default: "" },
        is_recurring: { type: Boolean, default: true, index: true },
        category: {
            type: String,
            trim: true,
            default: "academic",
            index: true
        },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
            index: true
        }
    },
    { ...schemaOptions, collection: "fee_types" }
);

feeTypeSchema.index({ school_id: 1, name: 1 }, { unique: true });

export const FeeTypeModel = models.FeeType || model("FeeType", feeTypeSchema);