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

export type FeeCreateInput = z.infer<typeof feeCreateSchema>;
export type FeePaymentInput = z.infer<typeof feePaymentSchema>;
