import { accountsService } from "../accounts/accounts.service";
import { transactionsRepository } from "../transactions/transactions.repository";

import type { AnalyticsQueryInput } from "./analytics.schema";

export class AnalyticsService {
    async getAnalytics(
        userId: string,
        query: AnalyticsQueryInput,
    ) {
        const { startDate, endDate } = this.getPeriodDateRange(query.period, query.startDate, query.endDate);

        const resolvedQuery = {
            ...query,
            startDate,
            endDate,
        };

        const [
            incomeVsExpense,
            categoryBreakdown,
            monthlyTrend,
            activeAccounts,
            paymentMethodBreakdown,
        ] = await Promise.all([
            transactionsRepository.getIncomeVsExpense(
                userId,
                resolvedQuery,
            ),
            transactionsRepository.getExpenseByCategory(
                userId,
                resolvedQuery,
            ),
            transactionsRepository.getMonthlyTrend(
                userId,
                resolvedQuery,
            ),
            accountsService.findAll(
                userId,
                { archived: false },
            ),
            transactionsRepository.getExpenseByPaymentMethod(
                userId,
                resolvedQuery,
            ),
        ]);

        const income = incomeVsExpense.income;
        const expense = incomeVsExpense.expense;
        const balance = income - expense;
        const savings = income > 0 ? ((income - expense) / income) * 100 : 0;

        const accountBreakdown = activeAccounts.map(acc => ({
            accountName: acc.name,
            balance: Number(acc.openingBalance || 0),
        }));

        return {
            income,
            expense,
            balance,
            savings,
            monthlyTrend,
            categoryBreakdown,
            accountBreakdown,
            paymentMethodBreakdown,
        };
    }

    private getPeriodDateRange(period: string, startDate?: Date, endDate?: Date) {
        const now = new Date();
        let start = startDate;
        let end = endDate;

        if (!start || !end) {
            if (period === "TODAY") {
                start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            } else if (period === "WEEK") {
                const day = now.getDay();
                const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                start = new Date(now.setDate(diff));
                start.setHours(0, 0, 0, 0);
                end = new Date(start);
                end.setDate(end.getDate() + 6);
                end.setHours(23, 59, 59, 999);
            } else if (period === "YEAR") {
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            } else {
                // Default to MONTH
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
        }
        return { startDate: start, endDate: end };
    }
}

export const analyticsService =
    new AnalyticsService();