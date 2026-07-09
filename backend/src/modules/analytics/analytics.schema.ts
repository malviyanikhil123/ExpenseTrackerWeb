import { z } from "zod";

export const analyticsPeriodSchema = z.enum([
    "WEEK",
    "MONTH",
    "YEAR",
    "CUSTOM",
]);

export const analyticsQuerySchema = z
    .object({
        period: analyticsPeriodSchema.default("MONTH"),

        startDate: z.coerce.date().optional(),

        endDate: z.coerce.date().optional(),

        accountId: z.string().uuid().optional(),

        categoryId: z.string().uuid().optional(),

        paymentMethodId: z.string().uuid().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.period === "CUSTOM") {
            if (!data.startDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["startDate"],
                    message:
                        "Start date is required for custom period.",
                });
            }

            if (!data.endDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message:
                        "End date is required for custom period.",
                });
            }

            if (
                data.startDate &&
                data.endDate &&
                data.startDate > data.endDate
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ["endDate"],
                    message:
                        "End date must be after start date.",
                });
            }
        }
    });

export type AnalyticsPeriod = z.infer<
    typeof analyticsPeriodSchema
>;

export type AnalyticsQueryInput = z.infer<
    typeof analyticsQuerySchema
>;