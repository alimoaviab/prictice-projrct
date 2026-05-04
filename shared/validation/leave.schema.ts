import { z } from "zod";

export const leaveCreateSchema = z.object({
  leave_type: z.enum(["sick", "personal", "family", "other"]),
  reason: z.string().min(1).max(1000),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()),
  requester_type: z.enum(["student", "teacher"]),
  requester_id: z.string(),
  requester_name: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

export const leaveUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "cancelled"]),
  rejection_reason: z.string().optional(),
  start_date: z.string().or(z.date()).optional(),
  end_date: z.string().or(z.date()).optional(),
});

export type LeaveCreateInput = z.infer<typeof leaveCreateSchema>;
export type LeaveUpdateInput = z.infer<typeof leaveUpdateSchema>;
