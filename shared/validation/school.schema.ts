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

export const schoolSettingsSchema = z.object({
  academy_name: z.string().max(160).optional().or(z.literal("")),
  academy_phone: z.string().max(30).optional().or(z.literal("")),
  academy_email: z.string().email().optional().or(z.literal("")),
  academy_address: z.string().max(240).optional().or(z.literal("")),
  logo_url: z.string().url().optional().or(z.literal("")),
  principal_name: z.string().max(120).optional().or(z.literal("")),
  principal_email: z.string().email().optional().or(z.literal("")),
  principal_phone: z.string().max(30).optional().or(z.literal("")),
  established_year: z.string().regex(/^\d{4}$/).optional().or(z.literal(""))
});

export type SchoolCreateInput = z.infer<typeof schoolCreateSchema>;
export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;
