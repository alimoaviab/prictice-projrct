import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  event_type: z.enum(["academic", "holiday", "sports", "cultural", "other"]).default("other"),
  start_date: z.string().or(z.date()),
  end_date: z.string().or(z.date()).optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  location: z.string().optional(),
  visibility: z.enum(["all", "specific_classes"]).default("all"),
  target_class_ids: z.array(z.string()).optional(),
  organizer: z.string().optional(),
  status: z.enum(["scheduled", "cancelled", "completed"]).default("scheduled"),
});

export const eventUpdateSchema = eventCreateSchema.partial();

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type EventUpdateInput = z.infer<typeof eventUpdateSchema>;
