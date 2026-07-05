import { accountsRepository } from "../accounts/accounts.repository";
import { debtsRepository } from "../debts/debts.repository";
import { transactionsRepository } from "../transactions/transactions.repository";

import type { DashboardQueryInput } from "./dashboard.schema";

export class DashboardService {
    async getDashboard(
        userId: string,
        query: DashboardQueryInput,
    ) {
        const [
            totalBalance,
            totalIncome,
            totalExpense,
            pendingLent,
            pendingBorrow,
            recentTransactions,
            recentDebts,
            monthlySummary,
        ] = await Promise.all([
            accountsRepository.getTotalBalance(userId),
            transactionsRepository.getTotalIncome(
                userId,
                query,
            ),

            transactionsRepository.getTotalExpense(
                userId,
                query,
            ),

            debtsRepository.getPendingLent(userId),
            debtsRepository.getPendingBorrow(userId),
            transactionsRepository.getRecentTransactions(
                userId,
            ),

            debtsRepository.getRecentDebts(userId),
            transactionsRepository.getMonthlySummary(
                userId,
                query,
            ),
        ]);

        return {
            totalBalance,
            totalIncome,
            totalExpense,
            pendingLent,
            pendingBorrow,
            recentTransactions,
            recentDebts,
            monthlySummary,
        };
    }
}

export const dashboardService =
    new DashboardService();