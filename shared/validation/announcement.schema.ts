import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementDto = z.infer<typeof updateAnnouncementSchema>;
