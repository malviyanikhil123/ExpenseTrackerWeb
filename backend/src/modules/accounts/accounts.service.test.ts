import { describe, it, expect, vi, beforeEach } from "vitest";
import { AccountsService } from "./accounts.service";
import { ApiError } from "../../lib/api-response";

vi.mock("./accounts.repository", () => ({
    accountsRepository: {
        findByName: vi.fn(),
        create: vi.fn(),
        findAll: vi.fn(),
        findById: vi.fn(),
        findDuplicate: vi.fn(),
        clearDefault: vi.fn(),
        findFirstActive: vi.fn(),
        update: vi.fn(),
        softDelete: vi.fn(),
    },
}));

import { accountsRepository } from "./accounts.repository";

const USER_ID = "user-123";

describe("AccountsService", () => {
    let service: AccountsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AccountsService();
    });

    describe("create", () => {
        it("should create an account successfully", async () => {
            vi.mocked(accountsRepository.findByName).mockResolvedValue(null);
            vi.mocked(accountsRepository.create).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
                type: "BANK",
                openingBalance: "1000.00",
                isDefault: false,
            } as any);

            const result = await service.create(USER_ID, {
                name: "Savings",
                type: "BANK",
                openingBalance: 1000,
            });

            expect(result.name).toBe("Savings");
        });

        it("should throw 409 if account name already exists", async () => {
            vi.mocked(accountsRepository.findByName).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
            } as any);

            await expect(
                service.create(USER_ID, {
                    name: "Savings",
                    type: "BANK",
                    openingBalance: 0,
                })
            ).rejects.toThrow(ApiError);
        });

        it("should clear default before creating if isDefault is true", async () => {
            vi.mocked(accountsRepository.findByName).mockResolvedValue(null);
            vi.mocked(accountsRepository.create).mockResolvedValue({
                id: "acc-1",
                name: "Primary",
                isDefault: true,
            } as any);

            await service.create(USER_ID, {
                name: "Primary",
                type: "CASH",
                openingBalance: 0,
                isDefault: true,
            });

            expect(accountsRepository.clearDefault).toHaveBeenCalledWith(USER_ID);
        });

        it("should NOT clear default if isDefault is false", async () => {
            vi.mocked(accountsRepository.findByName).mockResolvedValue(null);
            vi.mocked(accountsRepository.create).mockResolvedValue({
                id: "acc-1",
            } as any);

            await service.create(USER_ID, {
                name: "Secondary",
                type: "CASH",
                openingBalance: 0,
                isDefault: false,
            });

            expect(accountsRepository.clearDefault).not.toHaveBeenCalled();
        });
    });

    describe("findById", () => {
        it("should return an account", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
            } as any);

            const result = await service.findById(USER_ID, "acc-1");
            expect(result.id).toBe("acc-1");
        });

        it("should throw 404 if not found", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("update", () => {
        it("should update an account successfully", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
                isDefault: false,
            } as any);
            vi.mocked(accountsRepository.findDuplicate).mockResolvedValue(null);
            vi.mocked(accountsRepository.update).mockResolvedValue({
                id: "acc-1",
                name: "My Savings",
            } as any);

            const result = await service.update(USER_ID, "acc-1", {
                name: "My Savings",
            });

            expect(result.name).toBe("My Savings");
        });

        it("should throw 409 if duplicate name", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
                isDefault: false,
            } as any);
            vi.mocked(accountsRepository.findDuplicate).mockResolvedValue({
                id: "acc-2",
            } as any);

            await expect(
                service.update(USER_ID, "acc-1", { name: "Duplicate" })
            ).rejects.toThrow(ApiError);
        });

        it("should throw 400 if trying to archive a default account", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Default Acc",
                isDefault: true,
            } as any);
            vi.mocked(accountsRepository.findDuplicate).mockResolvedValue(null);

            await expect(
                service.update(USER_ID, "acc-1", { isArchived: true })
            ).rejects.toThrow(ApiError);
        });

        it("should clear default if isDefault is set to true", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
                isDefault: false,
            } as any);
            vi.mocked(accountsRepository.findDuplicate).mockResolvedValue(null);
            vi.mocked(accountsRepository.update).mockResolvedValue({
                id: "acc-1",
                isDefault: true,
            } as any);

            await service.update(USER_ID, "acc-1", { isDefault: true });

            expect(accountsRepository.clearDefault).toHaveBeenCalledWith(USER_ID);
        });
    });

    describe("delete", () => {
        it("should soft delete a non-default account", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Savings",
                isDefault: false,
            } as any);
            vi.mocked(accountsRepository.softDelete).mockResolvedValue({
                id: "acc-1",
            } as any);

            await service.delete(USER_ID, "acc-1");
            expect(accountsRepository.softDelete).toHaveBeenCalledWith(USER_ID, "acc-1");
        });

        it("should promote another active account when deleting a default account", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Primary",
                isDefault: true,
            } as any);
            vi.mocked(accountsRepository.findFirstActive).mockResolvedValue({
                id: "acc-2",
                name: "Secondary",
                isDefault: false,
            } as any);
            vi.mocked(accountsRepository.update).mockResolvedValue({
                id: "acc-2",
                isDefault: true,
            } as any);
            vi.mocked(accountsRepository.softDelete).mockResolvedValue({
                id: "acc-1",
            } as any);

            await service.delete(USER_ID, "acc-1");

            expect(accountsRepository.findFirstActive).toHaveBeenCalledWith(USER_ID, "acc-1");
            expect(accountsRepository.update).toHaveBeenCalledWith(USER_ID, "acc-2", {
                isDefault: true,
            });
            expect(accountsRepository.softDelete).toHaveBeenCalledWith(USER_ID, "acc-1");
        });

        it("should delete default account without promotion if no other active account exists", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue({
                id: "acc-1",
                name: "Primary",
                isDefault: true,
            } as any);
            vi.mocked(accountsRepository.findFirstActive).mockResolvedValue(null);
            vi.mocked(accountsRepository.softDelete).mockResolvedValue({
                id: "acc-1",
            } as any);

            await service.delete(USER_ID, "acc-1");

            expect(accountsRepository.findFirstActive).toHaveBeenCalledWith(USER_ID, "acc-1");
            expect(accountsRepository.update).not.toHaveBeenCalled();
            expect(accountsRepository.softDelete).toHaveBeenCalledWith(USER_ID, "acc-1");
        });

        it("should throw 404 if account not found", async () => {
            vi.mocked(accountsRepository.findById).mockResolvedValue(null);

            await expect(
                service.delete(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });
});
