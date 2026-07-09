import type { FastifyInstance } from "fastify";

import { authRoutes } from "../modules/auth/auth.routes";
import { categoriesRoutes } from "../modules/categories/categories.routes";
import { accountsRoutes } from "../modules/accounts/accounts.routes";
import { transactionsRoutes } from "../modules/transactions/transactions.routes";
import { debtsRoutes } from "../modules/debts/debts.routes";
import { repaymentsRoutes } from "../modules/repayments/repayments.routes";
import { dashboardRoutes } from "../modules/dashboard/dashboard.routes";
import { analyticsRoutes } from "../modules/analytics/analytics.routes";
import { profileRoutes } from "../modules/profile/profile.routes";
import { paymentMethodsRoutes } from "../modules/payment-methods/payment-methods.routes";

export async function registerRoutes(app: FastifyInstance) {
    app.register(authRoutes, {
        prefix: "/auth",
    });

    app.register(categoriesRoutes, {
        prefix: "/categories",
    });

    app.register(accountsRoutes, {
        prefix: "/accounts",
    });

    app.register(transactionsRoutes, {
        prefix: "/transactions",
    });

    app.register(debtsRoutes, {
        prefix: "/debts",
    });

    app.register(repaymentsRoutes, {
        prefix: "/repayments",
    });

    app.register(dashboardRoutes, {
        prefix: "/dashboard",
    });

    app.register(analyticsRoutes, {
        prefix: "/analytics",
    });

    app.register(profileRoutes, {
        prefix: "/profile",
    });

    app.register(paymentMethodsRoutes, {
        prefix: "/payment-methods",
    });
}