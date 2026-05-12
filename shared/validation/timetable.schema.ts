import { z } from "zod";

const dayEnum = z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);

export const createTimetableSchema = z.object({
  class_id: z.string().min(1),
  teacher_id: z.string().min(1),
  subject_id: z.string().min(1).optional(),
  subject: z.string().min(1).max(100).optional(),
  day: dayEnum.optional(),
  day_of_week: z.union([z.string(), z.number()]).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  end_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  period_number: z.number().optional(),
  room: z.string().optional(),
});

export const updateTimetableSchema = createTimetableSchema.partial();

export type CreateTimetableDto = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableDto = z.infer<typeof updateTimetableSchema>;
