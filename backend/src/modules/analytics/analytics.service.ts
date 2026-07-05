import { accountsRepository } from "../accounts/accounts.repository";
import { debtsRepository } from "../debts/debts.repository";
import { transactionsRepository } from "../transactions/transactions.repository";

import type { AnalyticsQueryInput } from "./analytics.schema";

export class AnalyticsService {
    async getAnalytics(
        userId: string,
        query: AnalyticsQueryInput,
    ) {
        const [
            incomeVsExpense,
            categoryBreakdown,
            monthlyTrend,
            accountBreakdown,
        ] = await Promise.all([
            transactionsRepository.getIncomeVsExpense(
                userId,
                query,
            ),
            transactionsRepository.getExpenseByCategory(
                userId,
                query,
            ),
            transactionsRepository.getMonthlyTrend(
                userId,
                query,
            ),
            accountsRepository.getAccountBreakdown(
                userId,
            ),
        ]);

        const income = incomeVsExpense.income;
        const expense = incomeVsExpense.expense;
        const balance = income - expense;
        const savings = income > 0 ? ((income - expense) / income) * 100 : 0;

        return {
            income,
            expense,
            balance,
            savings,
            monthlyTrend,
            categoryBreakdown,
            accountBreakdown,
        };
    }
}

export const analyticsService =
    new AnalyticsService();