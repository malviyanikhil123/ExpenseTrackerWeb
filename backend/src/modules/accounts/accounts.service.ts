import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../../db";
import { accounts } from "../../db/schema/accounts";
import { transactions } from "../../db/schema/transactions";
import { debts } from "../../db/schema/debts";
import { repayments } from "../../db/schema/repayments";
import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "./accounts.repository";
import type {
    AccountQueryInput,
    CreateAccountInput,
    UpdateAccountInput,
} from "./accounts.schema";

export class AccountsService {
    async create(userId: string, data: CreateAccountInput) {
        const existingAccount = await accountsRepository.findByName(
            userId,
            data.name,
        );

        if (existingAccount) {
            throw new ApiError(409, "Account already exists.");
        }

        if (data.isDefault) {
            await accountsRepository.clearDefault(userId);
        }

        const account = await accountsRepository.create(userId, data);
        const [populated] = await this.populateAccountsBalances(userId, [account]);
        return populated;
    }

    async findAll(
        userId: string,
        query: AccountQueryInput,
    ) {
        const accountsList = await accountsRepository.findAll(
            userId,
            query.archived,
        );

        const populated = await this.populateAccountsBalances(userId, accountsList);

        console.log("[accounts:list]", {
            userId,
            archived: query.archived ?? false,
            count: populated.length,
        });

        return populated;
    }

    async findById(
        userId: string,
        accountId: string,
    ) {
        const account = await accountsRepository.findById(
            userId,
            accountId,
        );

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        const [populated] = await this.populateAccountsBalances(userId, [account]);
        return populated;
    }

    async update(
        userId: string,
        accountId: string,
        data: UpdateAccountInput,
    ) {
        const account = await this.findById(
            userId,
            accountId,
        );

        const name = data.name ?? account.name;

        const duplicate =
            await accountsRepository.findDuplicate(
                userId,
                account.id,
                name,
            );

        if (duplicate) {
            throw new ApiError(409, "Account already exists.");
        }

        if (account.isDefault && data.isArchived) {
            throw new ApiError(
                400,
                "Default account cannot be archived.",
            );
        }

        if (data.isDefault) {
            await accountsRepository.clearDefault(userId);
        }

        const updated = await accountsRepository.update(
            userId,
            accountId,
            data,
        );

        if (!updated) {
            throw new ApiError(404, "Account not found.");
        }

        const [populated] = await this.populateAccountsBalances(userId, [updated]);
        return populated;
    }

    async delete(
        userId: string,
        accountId: string,
    ) {
        const account = await this.findById(
            userId,
            accountId,
        );

        if (account.isDefault) {
            const nextDefault = await accountsRepository.findFirstActive(
                userId,
                accountId,
            );

            if (nextDefault) {
                await accountsRepository.update(userId, nextDefault.id, {
                    isDefault: true,
                });
            }
        }

        return accountsRepository.softDelete(
            userId,
            accountId,
        );
    }

    async populateAccountsBalances(userId: string, accountsList: any[]) {
        if (accountsList.length === 0) return [];

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
        if (!isUuid) {
            return accountsList.map((acc) => {
                const limit = Number(acc.creditLimit || 0);
                const balance = acc.openingBalance !== undefined && acc.openingBalance !== null 
                    ? Number(acc.openingBalance) 
                    : 1000000;
                return {
                    ...acc,
                    openingBalance: balance.toFixed(2),
                    outstanding: "0.00",
                    availableCredit: limit.toFixed(2),
                    creditLimit: limit > 0 ? limit.toFixed(2) : null,
                };
            });
        }

        // 1. Fetch all transactions (excluding deleted)
        const txs = await db
            .select({
                id: transactions.id,
                accountId: transactions.accountId,
                destinationAccountId: transactions.destinationAccountId,
                type: transactions.type,
                amount: transactions.amount,
            })
            .from(transactions)
            .where(
                and(
                    eq(transactions.userId, userId),
                    isNull(transactions.deletedAt)
                )
            );

        // 2. Fetch all debts (excluding deleted)
        const userDebts = await db
            .select({
                id: debts.id,
                accountId: debts.accountId,
                type: debts.type,
                totalAmount: debts.totalAmount,
            })
            .from(debts)
            .where(
                and(
                    eq(debts.userId, userId),
                    isNull(debts.deletedAt)
                )
            );

        // 3. Fetch all repayments for those debts
        const debtIds = userDebts.map(d => d.id);
        const repaymentsList = debtIds.length > 0
            ? await db
                .select({
                    debtId: repayments.debtId,
                    accountId: repayments.accountId,
                    amount: repayments.amount,
                })
                .from(repayments)
                .where(inArray(repayments.debtId, debtIds))
            : [];

        // Map repayments by debt ID
        const repaymentsMap: Record<string, number> = {};
        for (const rep of repaymentsList) {
            repaymentsMap[rep.debtId] = (repaymentsMap[rep.debtId] || 0) + Number(rep.amount);
        }

        // Fetch all active accounts of the user to build complete mapping (Debit/UPI link resolution)
        const allUserAccounts = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    isNull(accounts.deletedAt)
                )
            );

        const allAccountsMap = new Map<string, any>();
        for (const acc of allUserAccounts) {
            allAccountsMap.set(acc.id, acc);
        }

        // Create a mapping of balances for ALL active accounts of the user
        const balances = new Map<string, { balance: number; outstanding: number }>();
        for (const acc of allUserAccounts) {
            balances.set(acc.id, {
                balance: Number(acc.openingBalance),
                outstanding: 0,
            });
        }

        // 4. Process Transactions to calculate raw balances
        for (const tx of txs) {
            const amt = Number(tx.amount);
            const accId = tx.accountId;

            if (tx.type === "INCOME") {
                const bal = balances.get(accId);
                if (bal) bal.balance += amt;
            } else if (tx.type === "EXPENSE") {
                const acc = allAccountsMap.get(accId);
                if (acc && acc.type === "CREDIT_CARD") {
                    const bal = balances.get(accId);
                    if (bal) bal.outstanding += amt;
                } else if (acc && (acc.type === "DEBIT_CARD" || acc.type === "UPI") && acc.linkedBankAccountId) {
                    // Subtract from linked bank account!
                    const bal = balances.get(acc.linkedBankAccountId);
                    if (bal) bal.balance -= amt;
                } else {
                    // CASH, BANK, E_WALLET
                    const bal = balances.get(accId);
                    if (bal) bal.balance -= amt;
                }
            } else if (tx.type === "TRANSFER") {
                const srcId = tx.accountId;
                const destId = tx.destinationAccountId;

                // Subtract from source balance
                const srcBal = balances.get(srcId);
                if (srcBal) srcBal.balance -= amt;

                // Add to destination
                if (destId) {
                    const destAcc = allAccountsMap.get(destId);
                    if (destAcc && destAcc.type === "CREDIT_CARD") {
                        // Payment to Credit Card decreases outstanding!
                        const destBal = balances.get(destId);
                        if (destBal) destBal.outstanding -= amt;
                    } else {
                        // CASH, BANK, E_WALLET
                        const destBal = balances.get(destId);
                        if (destBal) destBal.balance += amt;
                    }
                }
            }
        }

        // 5. Process Debts
        for (const d of userDebts) {
            const total = Number(d.totalAmount);
            const acc = allAccountsMap.get(d.accountId);
            if (acc) {
                const bal = balances.get(d.accountId);
                if (bal) {
                    if (d.type === "LENT") {
                        // Lending money: money leaves the account
                        if (acc.type === "CREDIT_CARD") {
                            bal.outstanding += total;
                        } else {
                            bal.balance -= total;
                        }
                    } else {
                        // BORROW: money enters the account (credit card cannot receive borrowed money)
                        bal.balance += total;
                    }
                }
            }
        }

        // 5.5 Process Repayments
        for (const rep of repaymentsList) {
            const amt = Number(rep.amount);
            const debtItem = userDebts.find(d => d.id === rep.debtId);
            if (!debtItem) continue;

            const repAcc = allAccountsMap.get(rep.accountId);
            if (repAcc) {
                const bal = balances.get(rep.accountId);
                if (bal) {
                    if (debtItem.type === "LENT") {
                        // Lender gets money back: increases balance or decreases Credit Card outstanding
                        if (repAcc.type === "CREDIT_CARD") {
                            bal.outstanding -= amt;
                        } else {
                            bal.balance += amt;
                        }
                    } else {
                        // Borrower pays money back: money leaves the account
                        if (repAcc.type === "CREDIT_CARD") {
                            bal.outstanding += amt;
                        } else {
                            bal.balance -= amt;
                        }
                    }
                }
            }
        }

        // 6. Map the calculated balances back to the requested accounts
        return accountsList.map(acc => {
            const bal = balances.get(acc.id) || { balance: 0, outstanding: 0 };
            const creditLimit = Number(acc.creditLimit || 0);

            if (acc.type === "CREDIT_CARD") {
                return {
                    ...acc,
                    openingBalance: (creditLimit - bal.outstanding).toFixed(2), // compatibility
                    outstanding: bal.outstanding.toFixed(2),
                    availableCredit: (creditLimit - bal.outstanding).toFixed(2),
                    creditLimit: creditLimit.toFixed(2),
                };
            } else if (acc.type === "DEBIT_CARD" || acc.type === "UPI") {
                return {
                    ...acc,
                    openingBalance: "0.00",
                };
            } else {
                return {
                    ...acc,
                    openingBalance: bal.balance.toFixed(2),
                };
            }
        });
    }
}

export const accountsService = new AccountsService();