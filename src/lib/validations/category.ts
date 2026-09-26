import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  defaultType: z
    .enum(["fixed", "variable"], {
      message: "defaultType must be 'fixed' or 'variable'",
    })
    .default("variable"),
  color: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  defaultType: z.enum(["fixed", "variable"]).optional(),
  color: z.string().trim().min(1).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const reorderCategoriesSchema = z.object({
  order: z
    .array(z.number().int().positive())
    .min(1, "Order array cannot be empty"),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;
