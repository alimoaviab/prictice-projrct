import { z } from "zod";

export const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);

export const attendanceCreateSchema = z.object({
  student_id: z.string().min(12),
  class_id: z.string().min(12),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  note: z.string().trim().max(300).optional().or(z.literal(""))
});

export const attendanceUpdateSchema = attendanceCreateSchema.partial();

export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
