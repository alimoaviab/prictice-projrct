import { z } from "zod";

export const studentCreateSchema = z.object({
  admission_no: z.string().min(1).max(40).optional(),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  class_id: z.string().min(12),
  subjects: z.array(z.string()).optional(),
  section: z.string().min(1).max(20),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8).max(128).optional(),
  guardian: z.object({
    name: z.string().min(1).max(120),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal(""))
  }),
  enrolled_at: z.coerce.date().optional()
});

export const studentUpdateSchema = studentCreateSchema.partial().extend({
  status: z.enum(["active", "inactive", "graduated", "transferred"]).optional()
});

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
