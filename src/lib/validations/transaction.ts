import { z } from "zod";

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const createTransactionSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, "Date must be a valid date in YYYY-MM-DD format"),
  description: z.string().trim().min(1, "Description is required"),
  amount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n > 0;
      },
      { message: "amount must be greater than 0" },
    )
    .transform((val) => Number(val).toFixed(2)),
  flow: z.enum(["income", "expense", "invest"]).default("expense"),
  isFixed: z.boolean().default(false),
  categoryId: z.number().int().positive().nullable().optional(),
  paymentMethodId: z.number().int().positive().nullable().optional(),
  recurringTemplateId: z.number().int().positive().nullable().optional(),
  note: z.string().trim().nullable().optional(),
  source: z.enum(["web", "shortcut"]).default("web"),
});

export const updateTransactionSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, "Date must be a valid date in YYYY-MM-DD format")
    .optional(),
  description: z
    .string()
    .trim()
    .min(1, "Description cannot be empty")
    .optional(),
  amount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n > 0;
      },
      { message: "amount must be greater than 0" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
  flow: z.enum(["income", "expense", "invest"]).optional(),
  isFixed: z.boolean().optional(),
  categoryId: z.number().int().positive().nullable().optional(),
  paymentMethodId: z.number().int().positive().nullable().optional(),
  note: z.string().trim().nullable().optional(),
  recurringTemplateId: z.unknown().optional(),
  source: z.unknown().optional(),
});

export const logRecurringTemplateSchema = z.object({
  date: z
    .string()
    .regex(dateRegex, "Date must be a valid date in YYYY-MM-DD format")
    .optional(),
  amount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n > 0;
      },
      { message: "amount must be greater than 0" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
});

export function parseMonthRange(
  month: string,
): { startDate: string; endDate: string } | null {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return null;
  }
  const [yearStr, monthStr] = month.split("-");
  const year = Number.parseInt(yearStr, 10);
  const monthNum = Number.parseInt(monthStr, 10);
  const startDate = `${yearStr}-${monthStr}-01`;
  const nextYear = monthNum === 12 ? year + 1 : year;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
  return { startDate, endDate };
}

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type LogRecurringTemplateInput = z.infer<
  typeof logRecurringTemplateSchema
>;
