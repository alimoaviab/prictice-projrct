import { z } from "zod";

export const feeCreateSchema = z.object({
  student_id: z.string().min(12),
  invoice_no: z.string().min(1).max(60),
  title: z.string().min(1).max(120),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  due_at: z.coerce.date()
});

export const feePaymentSchema = z.object({
  fee_id: z.string().min(12),
  amount: z.number().positive(),
  method: z.string().min(1).max(40),
  reference: z.string().max(120).optional()
});

export const feeTypeCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().default(""),
  is_recurring: z.boolean().default(true),
  category: z.enum(["academic", "transport", "activity", "misc"]).default("academic")
});

export const classFeeItemSchema = z.object({
  fee_type_id: z.string().min(12),
  amount: z.number().min(0),
  due_date: z.coerce.date(),
  is_monthly: z.boolean().default(true),
  notes: z.string().max(500).optional().default("")
});

export const classFeeSetSchema = z.object({
  academic_year_id: z.string().min(12),
  fees: z.array(classFeeItemSchema).min(1)
});

export const classFeeAddSchema = classFeeItemSchema;

export const monthlyFeeGenerateSchema = z.object({
  academic_year_id: z.string().min(12),
  month: z.string().min(1).max(20),
  year: z.number().int().min(2000).max(2100),
  force_regenerate: z.boolean().default(false)
});

export const monthlyFeeDuplicateSchema = monthlyFeeGenerateSchema.pick({ academic_year_id: true, month: true, year: true });

export const feeAdjustmentCreateSchema = z.object({
  student_id: z.string().min(12),
  academic_year_id: z.string().min(12),
  type: z.enum(["discount", "waiver", "penalty", "scholarship"]),
  amount: z.number().min(0),
  reason: z.string().min(1).max(500),
  valid_from: z.coerce.date(),
  valid_until: z.coerce.date()
});

export const feePaymentRecordSchema = z.object({
  student_id: z.string().min(12),
  amount: z.number().positive(),
  payment_date: z.coerce.date(),
  payment_method: z.enum(["cash", "cheque", "bank_transfer", "card", "online"]),
  reference_no: z.string().max(120).optional().default(""),
  notes: z.string().max(500).optional().default("")
});

export const feePaymentBulkSchema = z.object({
  payments: z.array(feePaymentRecordSchema.omit({ student_id: true })).min(1)
});

export const feeFilterSchema = z.object({
  class_id: z.string().min(12).optional(),
  month: z.string().min(1).optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(["unpaid", "partial", "paid", "void"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20)
});

export const feeAnalyticsFilterSchema = z.object({
  academic_year_id: z.string().min(12).optional(),
  class_id: z.string().min(12).optional(),
  days_overdue: z.coerce.number().int().min(0).optional(),
  min_amount: z.coerce.number().min(0).optional()
});

export type FeeCreateInput = z.infer<typeof feeCreateSchema>;
export type FeePaymentInput = z.infer<typeof feePaymentSchema>;
export type FeeTypeCreateInput = z.infer<typeof feeTypeCreateSchema>;
export type ClassFeeSetInput = z.infer<typeof classFeeSetSchema>;
export type ClassFeeItemInput = z.infer<typeof classFeeItemSchema>;
export type MonthlyFeeGenerateInput = z.infer<typeof monthlyFeeGenerateSchema>;
export type FeeAdjustmentCreateInput = z.infer<typeof feeAdjustmentCreateSchema>;
export type FeePaymentRecordInput = z.infer<typeof feePaymentRecordSchema>;
