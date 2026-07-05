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

        return transactionsRepository.create(userId, data);
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

        return transactionsRepository.update(
            userId,
            transactionId,
            data,
        );
    }

    async delete(
        userId: string,
        transactionId: string,
    ) {
        await this.findById(
            userId,
            transactionId,
        );

        return transactionsRepository.softDelete(
            userId,
            transactionId,
        );
    }
}

export const transactionsService =
    new TransactionsService();