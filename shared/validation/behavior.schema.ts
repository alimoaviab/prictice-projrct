import { z } from "zod";

export const createBehaviorSchema = z.object({
  student_id: z.string().min(1),
  class_id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  severity: z.enum(["low", "medium", "high"]),
  date: z.string().datetime(), // ISO date
});

export const updateBehaviorSchema = createBehaviorSchema.partial();

export type CreateBehaviorDto = z.infer<typeof createBehaviorSchema>;
export type UpdateBehaviorDto = z.infer<typeof updateBehaviorSchema>;
