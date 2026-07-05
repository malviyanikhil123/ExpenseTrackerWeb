import { z } from "zod";

export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);

export const createCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Category name must be at least 2 characters")
        .max(100, "Category name must not exceed 100 characters"),

    categoryIconId: z.uuid("Invalid category icon id"),

    type: categoryTypeSchema,

    color: z
        .string()
        .trim()
        .max(20, "Color must not exceed 20 characters")
        .optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryParamsSchema = z.object({
    id: z.uuid("Invalid category id"),
});

export const categoryQuerySchema = z.object({
    type: categoryTypeSchema.optional(),
});

export type CategoryType = z.infer<typeof categoryTypeSchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export type CategoryParamsInput = z.infer<typeof categoryParamsSchema>;

export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;