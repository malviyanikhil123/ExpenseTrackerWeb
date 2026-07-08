import { z } from "zod";

export const transactionTypeSchema = z.enum([
    "INCOME",
    "EXPENSE",
    "TRANSFER",
]);

export const createTransactionSchema = z.object({
    accountId: z.string().uuid("Invalid account id."),

    categoryId: z.string().uuid("Invalid category id.").optional().nullable(),

    destinationAccountId: z.string().uuid("Invalid destination account id.").optional().nullable(),

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
        .optional()
        .nullable(),

    attachmentUrl: z
        .string()
        .trim()
        .url("Invalid attachment URL.")
        .optional()
        .nullable(),
}).superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
        if (!data.destinationAccountId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["destinationAccountId"],
                message: "Destination account is required for transfers.",
            });
        }
        if (data.accountId === data.destinationAccountId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["destinationAccountId"],
                message: "Source and destination accounts must be different.",
            });
        }
    } else {
        if (!data.categoryId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["categoryId"],
                message: "Category is required for income/expense transactions.",
            });
        }
    }
});

export const updateTransactionSchema = z.object({
    accountId: z.string().uuid("Invalid account id.").optional(),
    categoryId: z.string().uuid("Invalid category id.").optional().nullable(),
    destinationAccountId: z.string().uuid("Invalid destination account id.").optional().nullable(),
    type: transactionTypeSchema.optional(),
    amount: z.number().positive("Amount must be greater than 0.").optional(),
    transactionDate: z.coerce.date().optional(),
    note: z.string().trim().max(500, "Note must not exceed 500 characters.").optional().nullable(),
    attachmentUrl: z.string().trim().url("Invalid attachment URL.").optional().nullable(),
});

export const transactionParamsSchema = z.object({
    id: z.string().uuid("Invalid transaction id."),
});

export const transactionQuerySchema = z.object({
    type: transactionTypeSchema.optional(),

    accountId: z.string().uuid().optional(),

    categoryId: z.string().uuid().optional(),

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