import { z } from "zod";

const academicYearBaseSchema = z.object({
  year: z.string().min(1).max(30),
  start_date: z.coerce.date(),
  end_date: z.coerce.date(),
  is_active: z.boolean().default(false),
  description: z.string().max(500).optional().or(z.literal(""))
});

export const academicYearCreateSchema = academicYearBaseSchema
  .refine((input) => input.start_date <= input.end_date, {
    message: "End date must be after start date.",
    path: ["end_date"]
  });

export const academicYearUpdateSchema = academicYearBaseSchema
  .partial()
  .refine(
    (input) =>
      !input.start_date || !input.end_date || input.start_date <= input.end_date,
    {
      message: "End date must be after start date.",
      path: ["end_date"]
    }
  );

export type AcademicYearCreateInput = z.infer<typeof academicYearCreateSchema>;
export type AcademicYearUpdateInput = z.infer<typeof academicYearUpdateSchema>;
