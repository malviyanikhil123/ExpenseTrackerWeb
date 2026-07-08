import {
    and,
    desc,
    eq,
    isNull,
    sql,
} from "drizzle-orm";

import { db } from "../../db";
import { repayments } from "../../db/schema/repayments";

import type {
    CreateRepaymentInput,
    UpdateRepaymentInput,
} from "./repayments.schema";

export class RepaymentsRepository {
    async create(data: CreateRepaymentInput) {
        const [repayment] = await db
            .insert(repayments)
            .values({
                debtId: data.debtId,
                accountId: data.accountId,
                amount: data.amount.toString(),
                repaymentDate: data.repaymentDate,
                note: data.note,
            })
            .returning();

        return repayment;
    }

    async findById(id: string) {
        const [repayment] = await db
            .select()
            .from(repayments)
            .where(eq(repayments.id, id))
            .limit(1);

        return repayment ?? null;
    }

    async findByDebtId(debtId: string) {
        return db
            .select()
            .from(repayments)
            .where(eq(repayments.debtId, debtId))
            .orderBy(desc(repayments.repaymentDate));
    }

    async getTotalRepaid(debtId: string) {
        const [result] = await db
            .select({
                total: sql<string>`
          COALESCE(SUM(${repayments.amount}), 0)
        `,
            })
            .from(repayments)
            .where(eq(repayments.debtId, debtId));

        return Number(result.total);
    }

    async update(
        repaymentId: string,
        data: UpdateRepaymentInput,
    ) {
        const [repayment] = await db
            .update(repayments)
            .set({
                ...(data.amount !== undefined && {
                    amount: data.amount.toString(),
                }),

                ...(data.repaymentDate && {
                    repaymentDate: data.repaymentDate,
                }),

                ...(data.accountId !== undefined && {
                    accountId: data.accountId,
                }),

                ...(data.note !== undefined && {
                    note: data.note,
                }),

                updatedAt: new Date(),
            })
            .where(eq(repayments.id, repaymentId))
            .returning();

        return repayment ?? null;
    }

    async delete(repaymentId: string) {
        const [repayment] = await db
            .delete(repayments)
            .where(eq(repayments.id, repaymentId))
            .returning();

        return repayment ?? null;
    }
}

export const repaymentsRepository =
    new RepaymentsRepository();