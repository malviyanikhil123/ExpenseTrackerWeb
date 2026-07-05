import {
    and,
    desc,
    eq,
    gte,
    isNull,
    lte,
} from "drizzle-orm";

import { db } from "../../db";
import { debts } from "../../db/schema/debts";

import type {
    CreateDebtInput,
    DebtQueryInput,
    UpdateDebtInput,
} from "./debts.schema";

export class DebtsRepository {
    async create(
        userId: string,
        data: CreateDebtInput,
    ) {
        const [debt] = await db
            .insert(debts)
            .values({
                userId,
                accountId: data.accountId,
                type: data.type,
                partyName: data.partyName,
                partyPhone: data.partyPhone,
                totalAmount: data.totalAmount.toString(),
                debtDate: data.debtDate,
                status: "PENDING",
                note: data.note,
            })
            .returning();

        return debt;
    }

    async findById(
        userId: string,
        debtId: string,
    ) {
        const [debt] = await db
            .select()
            .from(debts)
            .where(
                and(
                    eq(debts.id, debtId),
                    eq(debts.userId, userId),
                    isNull(debts.deletedAt),
                ),
            )
            .limit(1);

        return debt ?? null;
    }

    async findAll(
        userId: string,
        query: DebtQueryInput,
    ) {
        return db
            .select()
            .from(debts)
            .where(
                and(
                    eq(debts.userId, userId),
                    isNull(debts.deletedAt),

                    query.type
                        ? eq(debts.type, query.type)
                        : undefined,

                    query.status
                        ? eq(debts.status, query.status)
                        : undefined,

                    query.accountId
                        ? eq(
                            debts.accountId,
                            query.accountId,
                        )
                        : undefined,

                    query.startDate
                        ? gte(
                            debts.debtDate,
                            query.startDate,
                        )
                        : undefined,

                    query.endDate
                        ? lte(
                            debts.debtDate,
                            query.endDate,
                        )
                        : undefined,
                ),
            )
            .orderBy(desc(debts.debtDate));
    }

    async update(
        userId: string,
        debtId: string,
        data: UpdateDebtInput,
    ) {
        const [debt] = await db
            .update(debts)
            .set({
                ...(data.accountId && {
                    accountId: data.accountId,
                }),

                ...(data.type && {
                    type: data.type,
                }),

                ...(data.partyName && {
                    partyName: data.partyName,
                }),

                ...(data.partyPhone !== undefined && {
                    partyPhone: data.partyPhone,
                }),

                ...(data.totalAmount !== undefined && {
                    totalAmount:
                        data.totalAmount.toString(),
                }),

                ...(data.debtDate && {
                    debtDate: data.debtDate,
                }),

                ...(data.note !== undefined && {
                    note: data.note,
                }),

                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(debts.id, debtId),
                    eq(debts.userId, userId),
                    isNull(debts.deletedAt),
                ),
            )
            .returning();

        return debt ?? null;
    }

    async updateStatus(
        userId: string,
        debtId: string,
        status: "PENDING" | "COMPLETED",
    ) {
        const [debt] = await db
            .update(debts)
            .set({
                status,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(debts.id, debtId),
                    eq(debts.userId, userId),
                ),
            )
            .returning();

        return debt ?? null;
    }

    async softDelete(
        userId: string,
        debtId: string,
    ) {
        const [debt] = await db
            .update(debts)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(debts.id, debtId),
                    eq(debts.userId, userId),
                    isNull(debts.deletedAt),
                ),
            )
            .returning();

        return debt ?? null;
    }

    async getPendingLent(userId: string) {
        const rows = await db
            .select({ total: debts.totalAmount })
            .from(debts)
            .where(
                and(
                    eq(debts.userId, userId),
                    eq(debts.type, "LENT"),
                    eq(debts.status, "PENDING"),
                    isNull(debts.deletedAt),
                ),
            );

        return rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
    }

    async getPendingBorrow(userId: string) {
        const rows = await db
            .select({ total: debts.totalAmount })
            .from(debts)
            .where(
                and(
                    eq(debts.userId, userId),
                    eq(debts.type, "BORROW"),
                    eq(debts.status, "PENDING"),
                    isNull(debts.deletedAt),
                ),
            );

        return rows.reduce((sum, r) => sum + Number(r.total ?? 0), 0);
    }

    async getRecentDebts(userId: string, limit = 5) {
        return db
            .select()
            .from(debts)
            .where(and(eq(debts.userId, userId), isNull(debts.deletedAt)))
            .orderBy(desc(debts.debtDate))
            .limit(limit);
    }

    async getDebtSummary(userId: string) {
        const pendingLent = await this.getPendingLent(userId);
        const pendingBorrow = await this.getPendingBorrow(userId);
        return { pendingLent, pendingBorrow };
    }
}

export const debtsRepository =
    new DebtsRepository();