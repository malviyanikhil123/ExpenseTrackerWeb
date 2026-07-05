import { describe, it, expect, vi, beforeEach } from "vitest";
import { DebtsService } from "./debts.service";
import { ApiError } from "../../lib/api-response";

vi.mock("./debts.repository", () => ({
    debtsRepository: {
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
    },
}));

import { debtsRepository } from "./debts.repository";
import { accountsRepository } from "../accounts/accounts.repository";

const USER_ID = "user-123";

describe("DebtsService", () => {
    let service: DebtsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DebtsService();
    });

    describe("create", () => {
        it("should create a debt when account exists", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(debtsRepository.create).mockResolvedValue({
                id: "debt-1",
                type: "LENT",
                partyName: "John",
                totalAmount: "500.00",
            } as any);

            const result = await service.create(USER_ID, {
                accountId: "acc-1",
                type: "LENT",
                partyName: "John",
                totalAmount: 500,
                debtDate: new Date("2025-01-15"),
            });

            expect(result.id).toBe("debt-1");
        });

        it("should throw 404 if account not found", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue(null);

            await expect(
                service.create(USER_ID, {
                    accountId: "nonexistent",
                    type: "LENT",
                    partyName: "John",
                    totalAmount: 500,
                    debtDate: new Date(),
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("findById", () => {
        it("should return a debt", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
            } as any);

            const result = await service.findById(USER_ID, "debt-1");
            expect(result.id).toBe("debt-1");
        });

        it("should throw 404 if not found", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("update", () => {
        it("should update a pending debt", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                status: "PENDING",
            } as any);
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
            } as any);
            vi.mocked(debtsRepository.update).mockResolvedValue({
                id: "debt-1",
                partyName: "Updated",
            } as any);

            const result = await service.update(USER_ID, "debt-1", {
                partyName: "Updated",
            });

            expect(result.partyName).toBe("Updated");
        });

        it("should throw 400 if debt is completed", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                status: "COMPLETED",
            } as any);

            await expect(
                service.update(USER_ID, "debt-1", { partyName: "New" })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if account for update not found", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                status: "PENDING",
            } as any);
            vi.mocked(accountsRepository.findById).mockResolvedValue(null);

            await expect(
                service.update(USER_ID, "debt-1", {
                    accountId: "nonexistent",
                })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("delete", () => {
        it("should soft delete a pending debt", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                status: "PENDING",
            } as any);
            vi.mocked(debtsRepository.softDelete).mockResolvedValue({
                id: "debt-1",
            } as any);

            await service.delete(USER_ID, "debt-1");
            expect(debtsRepository.softDelete).toHaveBeenCalled();
        });

        it("should throw 400 if deleting a completed debt", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                status: "COMPLETED",
            } as any);

            await expect(
                service.delete(USER_ID, "debt-1")
            ).rejects.toThrow(ApiError);
        });
    });
});
