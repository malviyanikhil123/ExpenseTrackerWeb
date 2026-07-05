import { z } from "zod";

export const dashboardPeriodSchema = z.enum([
    "TODAY",
    "WEEK",
    "MONTH",
    "YEAR",
    "CUSTOM",
]);

export const dashboardQuerySchema = z
    .object({
        period: dashboardPeriodSchema.default("MONTH"),

        startDate: z.coerce.date().optional(),

        endDate: z.coerce.date().optional(),
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

export type DashboardPeriod = z.infer<
    typeof dashboardPeriodSchema
>;

export type DashboardQueryInput = z.infer<
    typeof dashboardQuerySchema
>;