import { z } from "zod";

export const classCreateSchema = z.object({
  name: z.string().min(1).max(80),
  academy_care_id: z.string().min(12),
  teacher_ids: z.array(z.string().min(12)).optional().default([]),
  subjects: z.array(z.string().min(1).max(80)).min(1),
  room_number: z.string().max(40).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal(""))
});

export const classUpdateSchema = classCreateSchema.partial();

export type ClassCreateInput = z.infer<typeof classCreateSchema>;
export type ClassUpdateInput = z.infer<typeof classUpdateSchema>;
