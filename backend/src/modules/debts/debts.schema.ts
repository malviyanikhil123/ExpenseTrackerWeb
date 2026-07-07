import { z } from "zod";

export const debtTypeSchema = z.enum([
  "LENT",
  "BORROW",
]);

export const debtStatusSchema = z.enum([
  "PENDING",
  "COMPLETED",
]);

export const createDebtSchema = z.object({
  accountId: z.uuid("Invalid account id."),

  type: debtTypeSchema,

  partyName: z
    .string()
    .trim()
    .min(2, "Party name must be at least 2 characters.")
    .max(150, "Party name must not exceed 150 characters."),

  partyPhone: z
    .string()
    .trim()
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone number must be in E.164 format.",
    )
    .optional(),

  phoneNumber: z
    .string()
    .trim()
    .regex(
      /^\+?\d+$/,
      "Phone number must contain only digits and an optional country code prefix.",
    )
    .optional()
    .nullable()
    .or(z.literal("")),

  totalAmount: z
    .number({
      error: "Amount is required.",
    })
    .positive("Amount must be greater than 0."),

  debtDate: z.coerce.date({
    error: "Debt date is required.",
  }),

  dueDate: z.coerce.date().optional().nullable().or(z.literal("")),

  note: z
    .string()
    .trim()
    .max(500, "Note must not exceed 500 characters.")
    .optional(),
});

export const updateDebtSchema =
  createDebtSchema.partial();

export const debtParamsSchema = z.object({
  id: z.uuid("Invalid debt id."),
});

export const debtQuerySchema = z.object({
  type: debtTypeSchema.optional(),

  status: debtStatusSchema.optional(),

  accountId: z.uuid().optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

export type DebtType = z.infer<
  typeof debtTypeSchema
>;

export type DebtStatus = z.infer<
  typeof debtStatusSchema
>;

export type CreateDebtInput = z.infer<
  typeof createDebtSchema
>;

export type UpdateDebtInput = z.infer<
  typeof updateDebtSchema
>;

export type DebtParamsInput = z.infer<
  typeof debtParamsSchema
>;

export type DebtQueryInput = z.infer<
  typeof debtQuerySchema
>;