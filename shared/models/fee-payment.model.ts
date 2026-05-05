import { Schema, Types, model, models } from "mongoose";
import { schemaOptions, tenantField } from "./base";

const feePaymentSchema = new Schema(
    {
        school_id: tenantField,
        receipt_no: { type: String, required: true, trim: true },
        student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
        class_id: { type: Types.ObjectId, ref: "Class", index: true },
        academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true },
        amount: { type: Number, required: true, min: 0 },
        payment_date: { type: Date, required: true, index: true },
        payment_method: {
            type: String,
            enum: ["cash", "cheque", "bank_transfer", "card", "online"],
            required: true,
            index: true
        },
        reference_no: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        status: { type: String, enum: ["completed", "reversed"], default: "completed", index: true },
        allocations: [
            {
                fee_id: { type: Types.ObjectId, ref: "Fee" },
                fee_type_id: { type: Types.ObjectId, ref: "FeeType" },
                month: { type: String, trim: true },
                amount: { type: Number, default: 0 }
            }
        ],
        received_by: { type: Types.ObjectId, ref: "User" }
    },
    { ...schemaOptions, collection: "fee_payments" }
);

feePaymentSchema.index({ school_id: 1, receipt_no: 1 }, { unique: true });
feePaymentSchema.index({ school_id: 1, student_id: 1, payment_date: -1 });

export const FeePaymentModel = models.FeePayment || model("FeePayment", feePaymentSchema);