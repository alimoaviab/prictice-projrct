import { z } from "zod";

export const teacherCreateSchema = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().max(80).optional().or(z.literal("")),
  email: z.string().email(),
  phone: z.string().min(6).max(30),
  qualification: z.string().max(120).optional().or(z.literal("")),
  subjects: z.array(z.string().min(1).max(80)).default([]),
  class_ids: z.array(z.string().min(12)).optional().default([]),
  password: z.string().min(6).max(128)
});

export type TeacherCreateInput = z.infer<typeof teacherCreateSchema>;
