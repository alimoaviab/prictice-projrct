import { z } from "zod";

const dayEnum = z.enum(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]);

export const createTimetableSchema = z.object({
  class_id: z.string().min(1),
  teacher_id: z.string().min(1),
  subject: z.string().min(1).max(100),
  day: dayEnum,
  start_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  end_time: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
});

export const updateTimetableSchema = createTimetableSchema.partial();

export type CreateTimetableDto = z.infer<typeof createTimetableSchema>;
export type UpdateTimetableDto = z.infer<typeof updateTimetableSchema>;
