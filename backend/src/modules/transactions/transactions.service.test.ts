import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionsService } from "./transactions.service";
import { ApiError } from "../../lib/api-response";

vi.mock("./transactions.repository", () => ({
    transactionsRepository: {
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

vi.mock("../accounts/accounts.repository", () => ({
    accountsRepository: {
        findById: vi.fn(),
        adjustBalance: vi.fn(),
    },
}));

vi.mock("../categories/categories.repository", () => ({
    categoriesRepository: {
        findById: vi.fn(),
    },
}));

import { transactionsRepository } from "./transactions.repository";
import { accountsRepository } from "../accounts/accounts.repository";
import { categoriesRepository } from "../categories/categories.repository";

const USER_ID = "user-123";

describe("TransactionsService", () => {
    let service: TransactionsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TransactionsService();
    });

    describe("create", () => {
        it("should create a transaction when account, category exist and types match", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                type: "EXPENSE",
            } as any);
            vi.mocked(transactionsRepository.create).mockResolvedValue({
                id: "txn-1",
                amount: "50.00",
                type: "EXPENSE",
            } as any);

            const result = await service.create(USER_ID, {
                accountId: "acc-1",
                categoryId: "cat-1",
                type: "EXPENSE",
                amount: 50,
                transactionDate: new Date("2025-01-15"),
            });

            expect(result.id).toBe("txn-1");
        });

        it("should throw 404 if account not found", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue(null);

            await expect(
                service.create(USER_ID, {
                    accountId: "nonexistent",
                    categoryId: "cat-1",
                    type: "EXPENSE",
                    amount: 50,
                    transactionDate: new Date(),
                })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if category not found", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(categoriesRepository.findById).mockResolvedValue(null);

            await expect(
                service.create(USER_ID, {
                    accountId: "acc-1",
                    categoryId: "nonexistent",
                    type: "EXPENSE",
                    amount: 50,
                    transactionDate: new Date(),
                })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 400 if category type mismatches transaction type", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                type: "INCOME",
            } as any);

            await expect(
                service.create(USER_ID, {
                    accountId: "acc-1",
                    categoryId: "cat-1",
                    type: "EXPENSE", // Mismatch with INCOME category
                    amount: 50,
                    transactionDate: new Date(),
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("findById", () => {
        it("should return a transaction", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue({
                id: "txn-1",
            } as any);

            const result = await service.findById(USER_ID, "txn-1");
            expect(result.id).toBe("txn-1");
        });

        it("should throw 404 if not found", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("update", () => {
        it("should update a transaction successfully", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue({
                id: "txn-1",
                accountId: "acc-1",
                categoryId: "cat-1",
                type: "EXPENSE",
                amount: "50.00",
            } as any);
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-1",
                type: "EXPENSE",
            } as any);
            vi.mocked(transactionsRepository.update).mockResolvedValue({
                id: "txn-1",
                amount: "75.00",
            } as any);

            const result = await service.update(USER_ID, "txn-1", {
                amount: 75,
            });

            expect(result.amount).toBe("75.00");
        });

        it("should throw 400 if updated category type mismatches", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue({
                id: "txn-1",
                accountId: "acc-1",
                categoryId: "cat-1",
                type: "EXPENSE",
            } as any);
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(categoriesRepository.findById).mockResolvedValue({
                id: "cat-2",
                type: "INCOME", // Mismatch
            } as any);

            await expect(
                service.update(USER_ID, "txn-1", {
                    categoryId: "cat-2",
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("delete", () => {
        it("should soft delete a transaction", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue({
                id: "txn-1",
                accountId: "acc-1",
                type: "EXPENSE",
                amount: "50.00",
            } as any);
            vi.mocked(transactionsRepository.softDelete).mockResolvedValue({
                id: "txn-1",
            } as any);

            await service.delete(USER_ID, "txn-1");
            expect(transactionsRepository.softDelete).toHaveBeenCalledWith(
                USER_ID,
                "txn-1"
            );
        });

        it("should throw 404 if transaction not found", async () => {
            vi.mocked(transactionsRepository.findById).mockResolvedValue(null);

            await expect(
                service.delete(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });
});
