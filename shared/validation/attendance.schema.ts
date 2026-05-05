import { z } from "zod";

export const attendanceStatusSchema = z.enum(["present", "absent", "late", "excused"]);

export const attendanceDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, use YYYY-MM-DD")
  .or(z.coerce.date())
  .transform((value) => (value instanceof Date ? value : new Date(value)));

export const attendanceCreateSchema = z.object({
  student_id: z.string().min(12),
  class_id: z.string().min(12),
  date: z.coerce.date(),
  status: attendanceStatusSchema,
  note: z.string().trim().max(300).optional().or(z.literal(""))
});

export const attendanceBulkMarkSchema = z.object({
  class_id: z.string().min(12),
  date: attendanceDateSchema,
  academic_year_id: z.string().min(12).optional().or(z.literal("")),
  records: z.record(attendanceStatusSchema)
});

export const attendanceUpdateSchema = attendanceCreateSchema.partial();

export type AttendanceCreateInput = z.infer<typeof attendanceCreateSchema>;
export type AttendanceUpdateInput = z.infer<typeof attendanceUpdateSchema>;
export type AttendanceBulkMarkInput = z.infer<typeof attendanceBulkMarkSchema>;
