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
            incomeByCategory,
            expenseByCategory,
            monthlyTrend,
            accountSummary,
            debtSummary,
        ] = await Promise.all([
            transactionsRepository.getIncomeVsExpense(
                userId,
                query,
            ),
            transactionsRepository.getIncomeByCategory(
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
            accountsRepository.getAccountSummary(
                userId,
            ),
            debtsRepository.getDebtSummary(
                userId,
            ),
        ]);

        return {
            incomeVsExpense,
            incomeByCategory,
            expenseByCategory,
            monthlyTrend,
            accountSummary,
            debtSummary,
        };
    }
}

export const analyticsService =
    new AnalyticsService();