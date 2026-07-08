import { accountsService } from "../accounts/accounts.service";
import { debtsRepository } from "../debts/debts.repository";
import { transactionsRepository } from "../transactions/transactions.repository";

import type { DashboardQueryInput } from "./dashboard.schema";

export class DashboardService {
    async getDashboard(
        userId: string,
        query: DashboardQueryInput,
    ) {
        // Resolve date range from period if not explicitly custom
        const { startDate, endDate } = this.getPeriodDateRange(query.period, query.startDate, query.endDate);

        const resolvedQuery = {
            ...query,
            startDate,
            endDate,
        };

        const [
            allAccounts,
            totalIncome,
            totalExpense,
            pendingLent,
            pendingBorrow,
            recentTransactions,
            recentDebts,
            monthlySummary,
        ] = await Promise.all([
            accountsService.findAll(userId, { archived: false }),
            transactionsRepository.getTotalIncome(
                userId,
                resolvedQuery,
            ),
            transactionsRepository.getTotalExpense(
                userId,
                resolvedQuery,
            ),
            debtsRepository.getPendingLent(userId),
            debtsRepository.getPendingBorrow(userId),
            transactionsRepository.getRecentTransactions(
                userId,
            ),
            debtsRepository.getRecentDebts(userId),
            transactionsRepository.getMonthlySummary(
                userId,
                resolvedQuery,
            ),
        ]);

        let totalAssets = 0;
        let totalOutstanding = 0;

        for (const acc of allAccounts) {
            if (acc.type === "CASH" || acc.type === "BANK" || acc.type === "E_WALLET") {
                totalAssets += Number(acc.openingBalance || 0);
            } else if (acc.type === "CREDIT_CARD") {
                totalOutstanding += Number(acc.outstanding || 0);
            }
        }

        const netWorth = totalAssets - totalOutstanding;
        const cashFlow = totalIncome - totalExpense;

        return {
            totalBalance: netWorth, // For backwards compatibility
            totalIncome,
            totalExpense,
            pendingLent,
            pendingBorrow,
            recentTransactions,
            recentDebts,
            monthlySummary,
            // New fields
            totalAssets,
            totalOutstanding,
            netWorth,
            monthlyIncome: totalIncome,
            monthlyExpense: totalExpense,
            cashFlow,
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

export const dashboardService =
    new DashboardService();