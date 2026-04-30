import { z } from "zod";

export const schoolCreateSchema = z.object({
  school_id: z.string().min(2).max(80).regex(/^[a-z0-9-_]+$/),
  name: z.string().min(2).max(160),
  code: z.string().min(2).max(20),
  domains: z.array(z.string().min(3)).default([]),
  plan: z
    .object({
      key: z.string().min(1).default("starter"),
      seats: z.number().int().nonnegative().default(0),
      expires_at: z.coerce.date().optional()
    })
    .optional()
});

export type SchoolCreateInput = z.infer<typeof schoolCreateSchema>;
