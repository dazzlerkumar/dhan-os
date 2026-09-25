import { z } from "zod";

export const paymentKindEnum = z.enum(["upi", "debit", "credit", "cash"], {
  message: "kind must be 'upi', 'debit', 'credit', or 'cash'",
});

export const createPaymentMethodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  issuer: z.string().trim().min(1).nullable().optional(),
  kind: paymentKindEnum,
  color: z.string().trim().min(1).nullable().optional(),
  // statementDay and dueDay are primarily meaningful for credit cards (1-31)
  statementDay: z.number().int().min(1).max(31).nullable().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  active: z.boolean().optional(),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema.partial();

export type CreatePaymentMethodInput = z.infer<
  typeof createPaymentMethodSchema
>;
export type UpdatePaymentMethodInput = z.infer<
  typeof updatePaymentMethodSchema
>;
