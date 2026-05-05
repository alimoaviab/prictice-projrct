import { z } from "zod";

export const createBehaviorSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  class_id: z.string().min(1, "Class is required"),
  incident_type: z.enum(["attendance", "conduct", "academic_dishonesty", "bullying", "vandalism", "other"], {
    errorMap: () => ({ message: "Invalid incident type" })
  }),
  description: z.string().min(1, "Description is required").max(2000),
  severity: z.enum(["minor", "moderate", "major", "critical"], {
    errorMap: () => ({ message: "Invalid severity level" })
  }),
  action_taken: z.string().optional(),
  status: z.enum(["open", "under_review", "resolved", "escalated"]).optional(),
  warning_count: z.number().int().min(0).optional(),
  parent_notified: z.boolean().optional(),
  notes: z.string().optional()
});

export const updateBehaviorSchema = createBehaviorSchema.partial();

export type CreateBehaviorDto = z.infer<typeof createBehaviorSchema>;
export type UpdateBehaviorDto = z.infer<typeof updateBehaviorSchema>;
