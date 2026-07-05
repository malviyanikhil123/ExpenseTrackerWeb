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

        return accountsRepository.create(userId, data);
    }

    async findAll(
        userId: string,
        query: AccountQueryInput,
    ) {
        return accountsRepository.findAll(
            userId,
            query.archived,
        );
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

        return account;
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

        return accountsRepository.update(
            userId,
            accountId,
            data,
        );
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
}

export const accountsService = new AccountsService();