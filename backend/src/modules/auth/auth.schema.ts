import { z } from "zod";

const email = z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255);

const password = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters");

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must not exceed 100 characters"),

    email,

    password,
});

export const loginSchema = z.object({
    email,

    password,
});

export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .trim()
        .min(1, "Refresh token is required"),
});

export const logoutSchema = z.object({
    refreshToken: z
        .string()
        .trim()
        .min(1, "Refresh token is required"),
});

export const changePasswordSchema = z
    .object({
        currentPassword: password,

        newPassword: password,
    })
    .refine(
        (data) => data.currentPassword !== data.newPassword,
        {
            message: "New password must be different from the current password",
            path: ["newPassword"],
        },
    );

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;