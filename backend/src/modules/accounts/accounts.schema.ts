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

export const createAccountSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Account name must be at least 2 characters.")
        .max(100, "Account name must not exceed 100 characters."),

    type: accountTypeSchema,

    openingBalance: z
        .number()
        .finite()
        .min(0, "Opening balance cannot be negative."),

    description: z
        .string()
        .trim()
        .max(255, "Description must not exceed 255 characters.")
        .optional(),

    color: z
        .string()
        .trim()
        .max(20, "Color must not exceed 20 characters.")
        .optional(),

    isDefault: z.boolean().optional(),

    isArchived: z.boolean().optional(),
});

export const updateAccountSchema = createAccountSchema
    .omit({
        openingBalance: true,
    })
    .partial();

export const accountParamsSchema = z.object({
    id: z.string().uuid("Invalid account id."),
});

export const accountQuerySchema = z.object({
    archived: z.coerce.boolean().optional(),
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