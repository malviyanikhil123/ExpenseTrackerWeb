import { z } from "zod";

export const updateProfileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters.")
        .max(100, "Full name must not exceed 100 characters.")
        .optional(),

    avatarUrl: z
        .string()
        .trim()
        .url("Invalid avatar URL.")
        .optional(),
});

export const updatePreferencesSchema = z.object({
    currency: z
        .string()
        .trim()
        .length(3, "Currency must be a valid ISO code."),

    theme: z.enum([
        "LIGHT",
        "DARK",
        "SYSTEM",
    ]),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(8, "Current password is required."),

        newPassword: z
            .string()
            .min(
                8,
                "New password must be at least 8 characters.",
            ),
    })
    .refine(
        (data) =>
            data.currentPassword !== data.newPassword,
        {
            message:
                "New password must be different from current password.",
            path: ["newPassword"],
        },
    );

export type UpdateProfileInput = z.infer<
    typeof updateProfileSchema
>;

export type UpdatePreferencesInput = z.infer<
    typeof updatePreferencesSchema
>;

export type ChangePasswordInput = z.infer<
    typeof changePasswordSchema
>;