import { and, asc, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "../../db";
import { accounts } from "../../db/schema/accounts";

import type {
    AccountType,
    CreateAccountInput,
    UpdateAccountInput,
} from "./accounts.schema";

export class AccountsRepository {
    async create(userId: string, data: CreateAccountInput) {
        const [account] = await db
            .insert(accounts)
            .values({
                userId,
                name: data.name,
                type: data.type,
                openingBalance: data.openingBalance !== undefined ? data.openingBalance.toFixed(2) : "0.00",
                description: data.description,
                color: data.color,
                isDefault: data.isDefault ?? false,
                creditLimit: (data.creditLimit !== undefined && data.creditLimit !== null) ? data.creditLimit.toFixed(2) : "0.00",
                statementDate: data.statementDate,
                dueDate: data.dueDate,
                linkedBankAccountId: data.linkedBankAccountId,
            })
            .returning();

        return account;
    }

    async findById(userId: string, accountId: string) {
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.id, accountId),
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                ),
            )
            .limit(1);

        return account ?? null;
    }

    async findAll(userId: string, archived?: boolean) {
        return db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.isArchived, archived ?? false),
                    isNull(accounts.deletedAt),
                ),
            )
            .orderBy(asc(accounts.name));
    }

    async findByName(userId: string, name: string) {
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.name, name),
                    isNull(accounts.deletedAt),
                ),
            )
            .limit(1);

        return account ?? null;
    }

    async findDuplicate(
        userId: string,
        accountId: string,
        name: string,
    ) {
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    ne(accounts.id, accountId),
                    eq(accounts.userId, userId),
                    eq(accounts.name, name),
                    isNull(accounts.deletedAt),
                ),
            )
            .limit(1);

        return account ?? null;
    }

    async clearDefault(userId: string) {
        await db
            .update(accounts)
            .set({
                isDefault: false,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                ),
            );
    }

    async findFirstActive(userId: string, excludeAccountId: string) {
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    ne(accounts.id, excludeAccountId),
                    eq(accounts.isArchived, false),
                    isNull(accounts.deletedAt),
                ),
            )
            .limit(1);

        return account ?? null;
    }

    async update(
        userId: string,
        accountId: string,
        data: UpdateAccountInput,
    ) {
        const updateData: any = {
            ...data,
        };

        if (data.creditLimit !== undefined) {
            updateData.creditLimit =
                data.creditLimit !== null
                    ? data.creditLimit.toFixed(2)
                    : null;
        }

        const [account] = await db
            .update(accounts)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(accounts.id, accountId),
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                ),
            )
            .returning();

        return account ?? null;
    }

    async softDelete(
        userId: string,
        accountId: string,
    ) {
        const [account] = await db
            .update(accounts)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(accounts.id, accountId),
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                ),
            )
            .returning();

        return account ?? null;
    }
    async adjustBalance(
        userId: string,
        accountId: string,
        delta: number,
    ) {
        if (delta === 0) return;

        const [account] = await db
            .update(accounts)
            .set({
                openingBalance: sql`(${accounts.openingBalance}::numeric + ${delta.toFixed(2)}::numeric)::numeric(12,2)`,
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(accounts.id, accountId),
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                ),
            )
            .returning();

        return account ?? null;
    }

    async getTotalBalance(userId: string) {
        const rows = await db
            .select({ openingBalance: accounts.openingBalance })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                    eq(accounts.isArchived, false),
                ),
            );

        return rows.reduce((sum, r) => sum + Number(r.openingBalance ?? 0), 0);
    }

    async getAccountSummary(userId: string) {
        const totalBalance = await this.getTotalBalance(userId);
        const rows = await db
            .select({ id: accounts.id })
            .from(accounts)
            .where(and(eq(accounts.userId, userId), isNull(accounts.deletedAt), eq(accounts.isArchived, false)));

        return { totalBalance, count: rows.length };
    }

    async getAccountBreakdown(userId: string) {
        const rows = await db
            .select({
                accountName: accounts.name,
                balance: accounts.openingBalance,
            })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt),
                    eq(accounts.isArchived, false),
                ),
            );

        return rows.map((r) => ({
            accountName: r.accountName,
            balance: Number(r.balance ?? 0),
        }));
    }

}

export const accountsRepository = new AccountsRepository();