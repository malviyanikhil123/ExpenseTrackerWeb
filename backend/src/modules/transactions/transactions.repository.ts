import {
    and,
    asc,
    desc,
    eq,
    gte,
    isNull,
    lte,
} from "drizzle-orm";

import { db } from "../../db";
import { transactions } from "../../db/schema/transactions";
import { categories } from "../../db/schema/categories";

import type {
    CreateTransactionInput,
    TransactionQueryInput,
    UpdateTransactionInput,
} from "./transactions.schema";

export class TransactionsRepository {
    async create(
        userId: string,
        data: CreateTransactionInput,
    ) {
        const [transaction] = await db
            .insert(transactions)
            .values({
                userId,
                accountId: data.accountId,
                categoryId: data.categoryId,
                type: data.type,
                amount: data.amount.toString(),
                transactionDate: data.transactionDate,
                note: data.note,
                attachmentUrl: data.attachmentUrl,
            })
            .returning();

        return transaction;
    }

    async findById(
        userId: string,
        transactionId: string,
    ) {
        const [transaction] = await db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.id, transactionId),
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt),
                ),
            )
            .limit(1);

        return transaction ?? null;
    }

    async findAll(
        userId: string,
        query: TransactionQueryInput,
    ) {
        return db
            .select()
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt),
                    query.type
                        ? eq(transactions.type, query.type)
                        : undefined,
                    query.accountId
                        ? eq(transactions.accountId, query.accountId)
                        : undefined,
                    query.categoryId
                        ? eq(
                            transactions.categoryId,
                            query.categoryId,
                        )
                        : undefined,
                    query.startDate
                        ? gte(
                            transactions.transactionDate,
                            query.startDate,
                        )
                        : undefined,
                    query.endDate
                        ? lte(
                            transactions.transactionDate,
                            query.endDate,
                        )
                        : undefined,
                ),
            )
            .orderBy(desc(transactions.transactionDate));
    }

    async update(
        userId: string,
        transactionId: string,
        data: UpdateTransactionInput,
    ) {
        const [transaction] = await db
            .update(transactions)
            .set({
                ...(data.accountId && {
                    accountId: data.accountId,
                }),
                ...(data.categoryId && {
                    categoryId: data.categoryId,
                }),
                ...(data.type && {
                    type: data.type,
                }),
                ...(data.amount !== undefined && {
                    amount: data.amount.toString(),
                }),
                ...(data.transactionDate && {
                    transactionDate: data.transactionDate,
                }),
                ...(data.note !== undefined && {
                    note: data.note,
                }),
                ...(data.attachmentUrl !== undefined && {
                    attachmentUrl: data.attachmentUrl,
                }),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(transactions.id, transactionId),
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt),
                ),
            )
            .returning();

        return transaction ?? null;
    }

    async softDelete(
        userId: string,
        transactionId: string,
    ) {
        const [transaction] = await db
            .update(transactions)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(transactions.id, transactionId),
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt),
                ),
            )
            .returning();

        return transaction ?? null;
    }

    async getTotalIncome(userId: string, query: any) {
        const filters = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];

        if (query.startDate) {
            filters.push(gte(transactions.transactionDate, query.startDate));
        }

        if (query.endDate) {
            filters.push(lte(transactions.transactionDate, query.endDate));
        }

        const rows = await db
            .select({ amount: transactions.amount })
            .from(transactions)
            .where(and(...filters, eq(transactions.type, "INCOME")));

        return rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
    }

    async getTotalExpense(userId: string, query: any) {
        const filters = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];

        if (query.startDate) {
            filters.push(gte(transactions.transactionDate, query.startDate));
        }

        if (query.endDate) {
            filters.push(lte(transactions.transactionDate, query.endDate));
        }

        const rows = await db
            .select({ amount: transactions.amount })
            .from(transactions)
            .where(and(...filters, eq(transactions.type, "EXPENSE")));

        return rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0);
    }

    async getRecentTransactions(userId: string, limit = 5) {
        return db
            .select()
            .from(transactions)
            .where(and(eq(transactions.userId, userId), isNull(transactions.deletedAt)))
            .orderBy(desc(transactions.transactionDate))
            .limit(limit);
    }

    async getMonthlySummary(userId: string, query: any) {
        // Simple implementation: return empty summary if no date range provided
        if (!query.startDate || !query.endDate) return [];

        const rows = await db
            .select({ amount: transactions.amount, date: transactions.transactionDate })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt),
                    gte(transactions.transactionDate, query.startDate),
                    lte(transactions.transactionDate, query.endDate),
                ),
            );

        const map: Record<string, number> = {};

        for (const r of rows) {
            const d = new Date(r.date as unknown as string);
            const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
            map[key] = (map[key] || 0) + Number(r.amount ?? 0);
        }

        return Object.entries(map).map(([k, v]) => ({ period: k, total: v }));
    }

    async getIncomeVsExpense(userId: string, query: any) {
        const income = await this.getTotalIncome(userId, query);
        const expense = await this.getTotalExpense(userId, query);
        return { income, expense };
    }

    async getIncomeByCategory(userId: string, query: any) {
        const filters = [eq(transactions.userId, userId), isNull(transactions.deletedAt), eq(transactions.type, "INCOME")];
        if (query.startDate) filters.push(gte(transactions.transactionDate, query.startDate));
        if (query.endDate) filters.push(lte(transactions.transactionDate, query.endDate));

        const rows = await db
            .select({ categoryId: transactions.categoryId, amount: transactions.amount })
            .from(transactions)
            .where(and(...filters));

        const map: Record<string, number> = {};
        for (const r of rows) {
            const id = String(r.categoryId);
            map[id] = (map[id] || 0) + Number(r.amount ?? 0);
        }

        return Object.entries(map).map(([categoryId, total]) => ({ categoryId, total }));
    }

    async getExpenseByCategory(userId: string, query: any) {
        const filters = [eq(transactions.userId, userId), isNull(transactions.deletedAt), eq(transactions.type, "EXPENSE")];
        if (query.startDate) filters.push(gte(transactions.transactionDate, query.startDate));
        if (query.endDate) filters.push(lte(transactions.transactionDate, query.endDate));

        const rows = await db
            .select({
                categoryId: transactions.categoryId,
                categoryName: categories.name,
                amount: transactions.amount,
            })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(...filters));

        const map: Record<string, { name: string; amount: number }> = {};
        for (const r of rows) {
            const id = String(r.categoryId);
            const name = r.categoryName || "Unknown";
            if (!map[id]) {
                map[id] = { name, amount: 0 };
            }
            map[id].amount += Number(r.amount ?? 0);
        }

        return Object.values(map).map((val) => ({
            categoryName: val.name,
            amount: val.amount,
        }));
    }

    async getMonthlyTrend(userId: string, query: any) {
        const filters = [eq(transactions.userId, userId), isNull(transactions.deletedAt)];
        if (query.startDate) filters.push(gte(transactions.transactionDate, query.startDate));
        if (query.endDate) filters.push(lte(transactions.transactionDate, query.endDate));

        const rows = await db
            .select({
                amount: transactions.amount,
                date: transactions.transactionDate,
                type: transactions.type,
            })
            .from(transactions)
            .where(and(...filters));

        const map: Record<string, { income: number; expense: number }> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        for (const r of rows) {
            const d = new Date(r.date as unknown as string);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            if (!map[key]) {
                map[key] = { income: 0, expense: 0 };
            }
            if (r.type === "INCOME") {
                map[key].income += Number(r.amount ?? 0);
            } else if (r.type === "EXPENSE") {
                map[key].expense += Number(r.amount ?? 0);
            }
        }

        return Object.entries(map).map(([month, data]) => ({
            month,
            income: data.income,
            expense: data.expense,
        }));
    }
}

export const transactionsRepository =
    new TransactionsRepository();