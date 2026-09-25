import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  defaultType: z.enum(["fixed", "variable"], {
    message: "defaultType must be 'fixed' or 'variable'",
  }),
  color: z.string().trim().min(1).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
