import { z } from "zod";

export const accountTypeSchema = z.enum([
    "CASH",
    "BANK",
    "E_WALLET",
    "UPI",
    "CREDIT_CARD",
    "DEBIT_CARD",
    // Keep in sync with DB enum `account_type`
]);

export const accountBaseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Account name must be at least 2 characters.")
        .max(100, "Account name must not exceed 100 characters."),

    type: accountTypeSchema,

    description: z
        .string()
        .trim()
        .max(255, "Description must not exceed 255 characters.")
        .optional()
        .nullable(),

    color: z
        .string()
        .trim()
        .max(20, "Color must not exceed 20 characters.")
        .optional()
        .nullable(),

    isDefault: z.boolean().optional(),

    isArchived: z.boolean().optional(),

    creditLimit: z
        .number()
        .min(0, "Credit limit cannot be negative.")
        .optional()
        .nullable(),

    statementDate: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .nullable(),

    dueDate: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .nullable(),

    linkedBankAccountId: z
        .string()
        .uuid("Invalid linked bank account id.")
        .optional()
        .nullable(),
});

export const createAccountSchema = accountBaseSchema
    .extend({
        openingBalance: z
            .number()
            .finite()
            .min(0, "Opening balance cannot be negative.")
            .optional()
            .default(0),
    })
    .superRefine((data, ctx) => {
        if (data.type === "CREDIT_CARD") {
            if (data.creditLimit === undefined || data.creditLimit === null || data.creditLimit <= 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["creditLimit"],
                    message: "Credit limit is required and must be greater than 0 for credit cards.",
                });
            }
        }
        if (data.type === "DEBIT_CARD" || data.type === "UPI") {
            if (!data.linkedBankAccountId) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["linkedBankAccountId"],
                    message: "Linked bank account is required.",
                });
            }
        }
    });

export const updateAccountSchema = accountBaseSchema.partial();

export const accountParamsSchema = z.object({
    id: z.string().uuid("Invalid account id."),
});

export const accountQuerySchema = z.object({
    archived: z
        .preprocess(
            (val) => {
                if (val === "true" || val === true) return true;
                if (val === "false" || val === false) return false;
                return val;
            },
            z.boolean()
        )
        .optional(),
});

export type AccountType = z.infer<typeof accountTypeSchema>;

export type CreateAccountInput = z.infer<
    typeof createAccountSchema
>;

export type UpdateAccountInput = z.infer<
    typeof updateAccountSchema
>;

export type AccountParamsInput = z.infer<
    typeof accountParamsSchema
>;

export type AccountQueryInput = z.infer<
    typeof accountQuerySchema
>;