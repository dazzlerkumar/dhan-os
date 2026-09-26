import { z } from "zod";
import { normalizeCycleMonth } from "@/lib/cards";

const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export const createStatementSchema = z.object({
  cycleMonth: z
    .string()
    .trim()
    .refine((val) => normalizeCycleMonth(val) !== null, {
      message: "cycleMonth must be in YYYY-MM or YYYY-MM-01 format",
    })
    .transform((val) => normalizeCycleMonth(val) as string),
  spend: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "spend must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
  generatedAmount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "generatedAmount must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2)),
  paidDate: z
    .string()
    .trim()
    .regex(dateRegex, "paidDate must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  rewards: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "rewards must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2))
    .default("0.00"),
});

export const updateStatementSchema = z.object({
  spend: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "spend must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
  generatedAmount: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "generatedAmount must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
  paidDate: z
    .string()
    .trim()
    .regex(dateRegex, "paidDate must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  rewards: z
    .union([z.number(), z.string()])
    .refine(
      (val) => {
        const n = Number(val);
        return !Number.isNaN(n) && n >= 0;
      },
      { message: "rewards must be a non-negative number" },
    )
    .transform((val) => Number(val).toFixed(2))
    .optional(),
});

export type CreateStatementInput = z.infer<typeof createStatementSchema>;
export type UpdateStatementInput = z.infer<typeof updateStatementSchema>;
