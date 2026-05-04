import { z } from "zod";

/**
 * Day of week mapping
 * Monday = 1, Tuesday = 2, ..., Sunday = 7
 * "Everyday" = 0 (special value)
 */
export const DAY_NAMES = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
  Everyday: 0
} as const;

export const timetableCreateSchema = z.object({
  class_id: z.string().regex(/^[0-9a-f]{24}$/i, "Class ID must be a valid MongoDB ObjectId"),
  teacher_id: z.string().regex(/^[0-9a-f]{24}$/i, "Teacher ID must be a valid MongoDB ObjectId"),
  subject_id: z.string().regex(/^[0-9a-f]{24}$/i, "Subject ID must be a valid MongoDB ObjectId"),

  // Accept either day name (string) or day number (number)
  day_of_week: z.union([
    z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Everyday"]),
    z.number().int().min(0).max(7)
  ]).transform(val => {
    if (typeof val === "string") {
      return DAY_NAMES[val as keyof typeof DAY_NAMES];
    }
    return val;
  }),

  period_number: z.number().int().min(1).max(10, "Period must be 1-10"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format"),
  room: z.string().trim().max(50).optional()
}).refine(
  data => {
    // Validate end_time is after start_time
    const [startHour, startMin] = data.start_time.split(":").map(Number);
    const [endHour, endMin] = data.end_time.split(":").map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    return endTotal > startTotal;
  },
  { message: "End time must be after start time" }
);

export const timetableUpdateSchema = z.object({
  class_id: z.string().regex(/^[0-9a-f]{24}$/i, "Class ID must be a valid MongoDB ObjectId").optional(),
  teacher_id: z.string().regex(/^[0-9a-f]{24}$/i, "Teacher ID must be a valid MongoDB ObjectId").optional(),
  subject_id: z.string().regex(/^[0-9a-f]{24}$/i, "Subject ID must be a valid MongoDB ObjectId").optional(),
  day_of_week: z.union([
    z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Everyday"]),
    z.number().int().min(0).max(7)
  ]).transform(val => {
    if (typeof val === "string") {
      return DAY_NAMES[val as keyof typeof DAY_NAMES];
    }
    return val;
  }).optional(),
  period_number: z.number().int().min(1).max(10, "Period must be 1-10").optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format").optional(),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be HH:MM format").optional(),
  room: z.string().trim().max(50).optional()
}).optional();

export type TimetableCreateInput = z.infer<typeof timetableCreateSchema>;
export type TimetableUpdateInput = z.infer<typeof timetableUpdateSchema>;
