import { Schema, Types, model, models } from "mongoose";
import { requiredString, schemaOptions, tenantField } from "./base";

const feeSchema = new Schema(
  {
    school_id: tenantField,
    student_id: { type: Types.ObjectId, ref: "Student", required: true, index: true },
    class_id: { type: Types.ObjectId, ref: "Class", index: true },
    academic_year_id: { type: Types.ObjectId, ref: "AcademicYear", index: true },
    fee_type_id: { type: Types.ObjectId, ref: "FeeType", index: true },
    invoice_no: requiredString,
    title: requiredString,
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    month: { type: String, trim: true, default: "" },
    year: { type: Number, default: 0, index: true },
    due_at: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "void"],
      default: "unpaid",
      index: true
    },
    paid_amount: { type: Number, default: 0, min: 0 },
    adjustment_amount: { type: Number, default: 0 },
    generated_at: { type: Date, default: Date.now, index: true },
    generated_by: { type: Types.ObjectId, ref: "User" },
    fee_components: [
      {
        fee_type_id: { type: Types.ObjectId, ref: "FeeType" },
        fee_type: { type: String, trim: true },
        amount: { type: Number, default: 0 },
        paid_amount: { type: Number, default: 0 }
      }
    ],
    payments: [
      {
        amount: Number,
        paid_at: Date,
        method: String,
        reference: String,
        received_by: { type: Types.ObjectId, ref: "User" }
      }
    ]
  },
  { ...schemaOptions, collection: "fees" }
);

feeSchema.index({ school_id: 1, student_id: 1, academic_year_id: 1, month: 1, year: 1 }, { unique: true, sparse: true });

feeSchema.index({ school_id: 1, student_id: 1, due_at: 1 });
feeSchema.index({ school_id: 1, status: 1, due_at: 1 });
feeSchema.index({ school_id: 1, invoice_no: 1 }, { unique: true });

export const FeeModel = models.Fee || model("Fee", feeSchema);
