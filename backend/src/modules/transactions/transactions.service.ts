import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";
import { accountsService } from "../accounts/accounts.service";
import { categoriesRepository } from "../categories/categories.repository";
import { paymentMethodsRepository } from "../payment-methods/payment-methods.repository";

import { transactionsRepository } from "./transactions.repository";
import type {
    CreateTransactionInput,
    TransactionQueryInput,
    UpdateTransactionInput,
} from "./transactions.schema";

export class TransactionsService {
    async create(
        userId: string,
        data: CreateTransactionInput,
    ) {
        const account = await accountsRepository.findById(
            userId,
            data.accountId,
        );

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        const paymentMethod = await paymentMethodsRepository.findById(data.paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(404, "Payment method not found.");
        }

        this.validatePaymentMethodAccountCombo(paymentMethod.code, account.type);

        if (data.type === "TRANSFER") {
            if (!data.destinationAccountId) {
                throw new ApiError(400, "Destination account is required for transfers.");
            }

            const destAccount = await accountsRepository.findById(
                userId,
                data.destinationAccountId,
            );

            if (!destAccount) {
                throw new ApiError(404, "Destination account not found.");
            }

            // Check that source/destination are not UPI/Debit card
            if (account.type === "DEBIT_CARD" || account.type === "UPI") {
                throw new ApiError(400, "Debit cards and UPI cannot be used as the source of a transfer.");
            }
            if (destAccount.type === "DEBIT_CARD" || destAccount.type === "UPI") {
                throw new ApiError(400, "Debit cards and UPI cannot be used as the destination of a transfer.");
            }

            // Perform transfer validations
            const [srcPopulated] = await accountsService.populateAccountsBalances(userId, [account]);
            const srcBalance = Number(srcPopulated.openingBalance);

            if (destAccount.type === "CREDIT_CARD") {
                const [destPopulated] = await accountsService.populateAccountsBalances(userId, [destAccount]);
                const outstanding = Number(destPopulated.outstanding);
                if (data.amount > outstanding) {
                    throw new ApiError(400, "Payment amount exceeds the outstanding credit card balance.");
                }
            }

            if (data.amount > srcBalance) {
                throw new ApiError(400, "Insufficient balance in source account.");
            }
        } else {
            // INCOME or EXPENSE
            if (!data.categoryId) {
                throw new ApiError(400, "Category is required.");
            }

            const category = await categoriesRepository.findById(
                userId,
                data.categoryId,
            );

            if (!category) {
                throw new ApiError(404, "Category not found.");
            }

            if (category.type !== data.type) {
                throw new ApiError(
                    400,
                    "Selected category does not match the transaction type.",
                );
            }

            // Perform Income/Expense validations
            if (data.type === "EXPENSE") {
                const [srcPopulated] = await accountsService.populateAccountsBalances(userId, [account]);

                if (account.type === "CREDIT_CARD") {
                    const outstanding = Number(srcPopulated.outstanding);
                    const creditLimit = Number(srcPopulated.creditLimit);
                    if (outstanding + data.amount > creditLimit) {
                        throw new ApiError(400, "Transaction exceeds available credit.");
                    }
                } else if (account.type === "DEBIT_CARD" || account.type === "UPI") {
                    if (!account.linkedBankAccountId) {
                        throw new ApiError(400, "Linked bank account not configured.");
                    }
                    const linkedBank = await accountsRepository.findById(userId, account.linkedBankAccountId);
                    if (!linkedBank) {
                        throw new ApiError(400, "Linked bank account not found.");
                    }
                    const [linkedPopulated] = await accountsService.populateAccountsBalances(userId, [linkedBank]);
                    const linkedBalance = Number(linkedPopulated.openingBalance);
                    if (data.amount > linkedBalance) {
                        throw new ApiError(400, "Transaction exceeds available balance of the linked bank account.");
                    }
                } else {
                    const balance = Number(srcPopulated.openingBalance);
                    if (data.amount > balance) {
                        throw new ApiError(400, "Transaction exceeds available balance.");
                    }
                }
            }
        }

        const transaction =
            await transactionsRepository.create(userId, data);

        return transaction;
    }

    async findAll(
        userId: string,
        query: TransactionQueryInput,
    ) {
        return transactionsRepository.findAll(userId, query);
    }

    async findById(
        userId: string,
        transactionId: string,
    ) {
        const transaction =
            await transactionsRepository.findById(
                userId,
                transactionId,
            );

        if (!transaction) {
            throw new ApiError(
                404,
                "Transaction not found.",
            );
        }

        return transaction;
    }

    async update(
        userId: string,
        transactionId: string,
        data: UpdateTransactionInput,
    ) {
        const transaction = await this.findById(
            userId,
            transactionId,
        );

        // Resolve updated attributes
        const accountId = data.accountId ?? transaction.accountId;
        const paymentMethodId = data.paymentMethodId ?? transaction.paymentMethodId;
        const type = data.type ?? transaction.type;
        const amount = data.amount ?? Number(transaction.amount);
        const categoryId = data.categoryId !== undefined ? data.categoryId : transaction.categoryId;
        const destinationAccountId = data.destinationAccountId !== undefined ? data.destinationAccountId : transaction.destinationAccountId;

        const account = await accountsRepository.findById(userId, accountId);
        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        const paymentMethod = await paymentMethodsRepository.findById(paymentMethodId);
        if (!paymentMethod) {
            throw new ApiError(404, "Payment method not found.");
        }

        this.validatePaymentMethodAccountCombo(paymentMethod.code, account.type);

        if (type === "TRANSFER") {
            if (!destinationAccountId) {
                throw new ApiError(400, "Destination account is required for transfers.");
            }
            const destAccount = await accountsRepository.findById(userId, destinationAccountId);
            if (!destAccount) {
                throw new ApiError(404, "Destination account not found.");
            }
            if (account.type === "DEBIT_CARD" || account.type === "UPI") {
                throw new ApiError(400, "Debit cards and UPI cannot be used as the source of a transfer.");
            }
            if (destAccount.type === "DEBIT_CARD" || destAccount.type === "UPI") {
                throw new ApiError(400, "Debit cards and UPI cannot be used as the destination of a transfer.");
            }
        } else {
            if (!categoryId) {
                throw new ApiError(400, "Category is required.");
            }
            const category = await categoriesRepository.findById(userId, categoryId);
            if (!category) {
                throw new ApiError(404, "Category not found.");
            }
            if (category.type !== type) {
                throw new ApiError(400, "Selected category does not match transaction type.");
            }
        }

        // Perform validation against "before-transaction" balances to avoid self-blocking
        // 1. Fetch current balances of relevant accounts
        const accountsToFetch = [account];
        if (transaction.accountId !== accountId) {
            const oldAcc = await accountsRepository.findById(userId, transaction.accountId);
            if (oldAcc) accountsToFetch.push(oldAcc);
        }
        if (destinationAccountId) {
            const destAcc = await accountsRepository.findById(userId, destinationAccountId);
            if (destAcc) accountsToFetch.push(destAcc);
        }
        if (transaction.destinationAccountId && transaction.destinationAccountId !== destinationAccountId) {
            const oldDestAcc = await accountsRepository.findById(userId, transaction.destinationAccountId);
            if (oldDestAcc) accountsToFetch.push(oldDestAcc);
        }

        const populatedList = await accountsService.populateAccountsBalances(userId, accountsToFetch);
        const populatedMap = new Map<string, any>();
        for (const p of populatedList) {
            populatedMap.set(p.id, p);
        }

        // 2. Compute "before" values by removing the old transaction's effect
        const oldAmt = Number(transaction.amount);
        const beforeBalances = new Map<string, { balance: number; outstanding: number }>();
        for (const p of populatedList) {
            beforeBalances.set(p.id, {
                balance: Number(p.openingBalance), // dynamically calculated balance is returned in openingBalance
                outstanding: Number(p.outstanding || 0),
            });
        }

        // Revert old transaction source effect
        const oldSrcBal = beforeBalances.get(transaction.accountId);
        if (oldSrcBal) {
            const oldSrcAcc = populatedMap.get(transaction.accountId);
            if (transaction.type === "INCOME") {
                oldSrcBal.balance -= oldAmt;
            } else if (transaction.type === "EXPENSE") {
                if (oldSrcAcc && oldSrcAcc.type === "CREDIT_CARD") {
                    oldSrcBal.outstanding -= oldAmt;
                } else if (oldSrcAcc && (oldSrcAcc.type === "DEBIT_CARD" || oldSrcAcc.type === "UPI") && oldSrcAcc.linkedBankAccountId) {
                    const linked = beforeBalances.get(oldSrcAcc.linkedBankAccountId);
                    if (linked) linked.balance += oldAmt;
                } else {
                    oldSrcBal.balance += oldAmt;
                }
            } else if (transaction.type === "TRANSFER") {
                oldSrcBal.balance += oldAmt;
            }
        }

        // Revert old transaction destination effect
        if (transaction.type === "TRANSFER" && transaction.destinationAccountId) {
            const oldDestBal = beforeBalances.get(transaction.destinationAccountId);
            if (oldDestBal) {
                const oldDestAcc = populatedMap.get(transaction.destinationAccountId);
                if (oldDestAcc && oldDestAcc.type === "CREDIT_CARD") {
                    oldDestBal.outstanding += oldAmt;
                } else {
                    oldDestBal.balance -= oldAmt;
                }
            }
        }

        // 3. Validate new transaction values against the computed "before" balances
        if (type === "EXPENSE") {
            const currentSrc = populatedMap.get(accountId);
            const srcBalState = beforeBalances.get(accountId) || { balance: 0, outstanding: 0 };
            if (currentSrc) {
                if (currentSrc.type === "CREDIT_CARD") {
                    const creditLimit = Number(currentSrc.creditLimit || 0);
                    if (srcBalState.outstanding + amount > creditLimit) {
                        throw new ApiError(400, "Transaction exceeds available credit.");
                    }
                } else if ((currentSrc.type === "DEBIT_CARD" || currentSrc.type === "UPI") && currentSrc.linkedBankAccountId) {
                    const linkedBalState = beforeBalances.get(currentSrc.linkedBankAccountId) || { balance: 0, outstanding: 0 };
                    if (amount > linkedBalState.balance) {
                        throw new ApiError(400, "Transaction exceeds available balance of the linked bank account.");
                    }
                } else {
                    if (amount > srcBalState.balance) {
                        throw new ApiError(400, "Transaction exceeds available balance.");
                    }
                }
            }
        } else if (type === "TRANSFER" && destinationAccountId) {
            const srcBalState = beforeBalances.get(accountId) || { balance: 0, outstanding: 0 };
            const destAcc = populatedMap.get(destinationAccountId);

            if (destAcc && destAcc.type === "CREDIT_CARD") {
                const destBalState = beforeBalances.get(destinationAccountId) || { balance: 0, outstanding: 0 };
                if (amount > destBalState.outstanding) {
                    throw new ApiError(400, "Payment amount exceeds the outstanding credit card balance.");
                }
            }

            if (amount > srcBalState.balance) {
                throw new ApiError(400, "Insufficient balance in source account.");
            }
        }

        const updated = await transactionsRepository.update(
            userId,
            transactionId,
            data,
        );

        return updated;
    }

    async delete(
        userId: string,
        transactionId: string,
    ) {
        const transaction = await this.findById(
            userId,
            transactionId,
        );

        return transactionsRepository.softDelete(
            userId,
            transactionId,
        );
    }

    private validatePaymentMethodAccountCombo(paymentMethodCode: string, accountType: string) {
        if (paymentMethodCode === "CASH") {
            if (accountType !== "CASH") {
                throw new ApiError(400, "Cash payment method requires a CASH account.");
            }
        } else if (
            paymentMethodCode === "GOOGLE_PAY" ||
            paymentMethodCode === "PHONEPE" ||
            paymentMethodCode === "BHIM" ||
            paymentMethodCode === "NET_BANKING"
        ) {
            if (accountType !== "BANK") {
                throw new ApiError(400, `${paymentMethodCode.replace("_", " ")} payment method requires a BANK account.`);
            }
        } else if (paymentMethodCode === "DEBIT_CARD") {
            if (accountType !== "BANK") {
                throw new ApiError(400, "Debit Card payment method requires a BANK account.");
            }
        } else if (paymentMethodCode === "CREDIT_CARD") {
            if (accountType !== "CREDIT_CARD") {
                throw new ApiError(400, "Credit Card payment method requires a CREDIT_CARD account.");
            }
        } else if (paymentMethodCode === "PAYTM") {
            if (accountType !== "E_WALLET") {
                throw new ApiError(400, "Paytm payment method requires an E_WALLET account.");
            }
        } else {
            throw new ApiError(400, "Unsupported payment method.");
        }
    }
}

export const transactionsService =
    new TransactionsService();