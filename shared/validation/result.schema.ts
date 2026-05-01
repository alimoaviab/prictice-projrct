import { z } from "zod";

const resultBaseSchema = z.object({
  exam_id: z.string().min(12),
  student_id: z.string().min(12),
  obtained_marks: z.coerce.number().min(0),
  grade: z.string().max(10).optional().or(z.literal("")),
  remarks: z.string().max(500).optional().or(z.literal(""))
});

export const resultCreateSchema = resultBaseSchema;

export type ResultCreateInput = z.infer<typeof resultCreateSchema>;