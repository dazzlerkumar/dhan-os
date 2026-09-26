import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  issuer: z.string().trim().min(1).nullable().optional(),
  kind: z.enum(["upi", "debit", "credit", "cash"], {
    message: "kind must be one of: upi, debit, credit, cash",
  }),
  color: z.string().trim().min(1).nullable().optional(),
  statementDay: z.number().int().min(1).max(31).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updatePaymentMethodSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  issuer: z.string().trim().nullable().optional(),
  kind: z.enum(["upi", "debit", "credit", "cash"]).optional(),
  color: z.string().trim().nullable().optional(),
  statementDay: z.number().int().min(1).max(31).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

export const toggleActiveSchema = z.object({
  active: z.boolean().optional(),
});

export const reorderPaymentMethodsSchema = z.object({
  order: z
    .array(z.number().int().positive())
    .min(1, "Order array cannot be empty"),
});

export type CreatePaymentMethodInput = z.infer<
  typeof createPaymentMethodSchema
>;
export type UpdatePaymentMethodInput = z.infer<
  typeof updatePaymentMethodSchema
>;
export type ReorderPaymentMethodsInput = z.infer<
  typeof reorderPaymentMethodsSchema
>;
