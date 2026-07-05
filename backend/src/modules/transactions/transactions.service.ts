import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";
import { categoriesRepository } from "../categories/categories.repository";

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

        const transaction =
            await transactionsRepository.create(userId, data);

        // Adjust account balance: INCOME +, EXPENSE -
        const delta =
            data.type === "INCOME"
                ? data.amount
                : -data.amount;

        await accountsRepository.adjustBalance(
            userId,
            data.accountId,
            delta,
        );

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

        const accountId =
            data.accountId ?? transaction.accountId;

        const categoryId =
            data.categoryId ?? transaction.categoryId;

        const type =
            data.type ?? transaction.type;

        const account = await accountsRepository.findById(
            userId,
            accountId,
        );

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        const category = await categoriesRepository.findById(
            userId,
            categoryId,
        );

        if (!category) {
            throw new ApiError(404, "Category not found.");
        }

        if (category.type !== type) {
            throw new ApiError(
                400,
                "Selected category does not match the transaction type.",
            );
        }

        // Reverse old transaction's effect on old account
        const oldDelta =
            transaction.type === "INCOME"
                ? -Number(transaction.amount)
                : Number(transaction.amount);

        await accountsRepository.adjustBalance(
            userId,
            transaction.accountId,
            oldDelta,
        );

        const updated =
            await transactionsRepository.update(
                userId,
                transactionId,
                data,
            );

        // Apply new transaction's effect on new account
        const newAmount =
            data.amount ?? Number(transaction.amount);
        const newDelta =
            type === "INCOME" ? newAmount : -newAmount;

        await accountsRepository.adjustBalance(
            userId,
            accountId,
            newDelta,
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

        // Reverse the transaction's effect on the account
        const reverseDelta =
            transaction.type === "INCOME"
                ? -Number(transaction.amount)
                : Number(transaction.amount);

        await accountsRepository.adjustBalance(
            userId,
            transaction.accountId,
            reverseDelta,
        );

        return transactionsRepository.softDelete(
            userId,
            transactionId,
        );
    }
}

export const transactionsService =
    new TransactionsService();