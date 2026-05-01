import { z } from "zod";

export const homeworkStatusSchema = z.enum(["draft", "assigned", "closed"]);

export const homeworkCreateSchema = z.object({
  class_id: z.string().min(12),
  teacher_id: z.string().min(12),
  subject: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  instructions: z.string().trim().max(3000).optional().or(z.literal("")),
  due_at: z.coerce.date(),
  status: homeworkStatusSchema.default("assigned")
});

export type HomeworkCreateInput = z.infer<typeof homeworkCreateSchema>;
