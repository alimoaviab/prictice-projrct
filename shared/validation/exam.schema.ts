import { z } from "zod";

const examBaseSchema = z.object({
  class_id: z.string().min(12),
  subject: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  starts_at: z.coerce.date(),
  max_marks: z.coerce.number().int().positive(),
  status: z.enum(["scheduled", "completed", "cancelled"]).default("scheduled"),
  description: z.string().max(500).optional().or(z.literal(""))
});

export const examCreateSchema = examBaseSchema;

export type ExamCreateInput = z.infer<typeof examCreateSchema>;