import { z } from "zod";

export const createRepaymentSchema = z.object({
    debtId: z.uuid("Invalid debt id."),

    amount: z
        .number({
            error: "Amount is required.",
        })
        .positive("Amount must be greater than 0."),

    repaymentDate: z.coerce.date({
        error: "Repayment date is required.",
    }),

    note: z
        .string()
        .trim()
        .max(500, "Note must not exceed 500 characters.")
        .optional(),
});

export const updateRepaymentSchema =
    createRepaymentSchema.partial();

export const repaymentParamsSchema = z.object({
    id: z.uuid("Invalid repayment id."),
});

export const repaymentQuerySchema = z.object({
    debtId: z.uuid().optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
});

export type CreateRepaymentInput = z.infer<
    typeof createRepaymentSchema
>;

export type UpdateRepaymentInput = z.infer<
    typeof updateRepaymentSchema
>;

export type RepaymentParamsInput = z.infer<
    typeof repaymentParamsSchema
>;

export type RepaymentQueryInput = z.infer<
    typeof repaymentQuerySchema
>;