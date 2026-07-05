import { z } from "zod";

export const transactionTypeSchema = z.enum([
    "INCOME",
    "EXPENSE",
]);

export const createTransactionSchema = z.object({
    accountId: z.uuid("Invalid account id."),

    categoryId: z.uuid("Invalid category id."),

    type: transactionTypeSchema,

    amount: z
        .number({
            error: "Amount is required.",
        })
        .positive("Amount must be greater than 0."),

    transactionDate: z.coerce.date({
        error: "Transaction date is required.",
    }),

    note: z
        .string()
        .trim()
        .max(500, "Note must not exceed 500 characters.")
        .optional(),

    attachmentUrl: z
        .string()
        .trim()
        .url("Invalid attachment URL.")
        .optional(),
});

export const updateTransactionSchema =
    createTransactionSchema.partial();

export const transactionParamsSchema = z.object({
    id: z.uuid("Invalid transaction id."),
});

export const transactionQuerySchema = z.object({
    type: transactionTypeSchema.optional(),

    accountId: z.uuid().optional(),

    categoryId: z.uuid().optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),
});

export type TransactionType = z.infer<
    typeof transactionTypeSchema
>;

export type CreateTransactionInput = z.infer<
    typeof createTransactionSchema
>;

export type UpdateTransactionInput = z.infer<
    typeof updateTransactionSchema
>;

export type TransactionParamsInput = z.infer<
    typeof transactionParamsSchema
>;

export type TransactionQueryInput = z.infer<
    typeof transactionQuerySchema
>;