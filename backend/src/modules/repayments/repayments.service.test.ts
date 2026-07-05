import { describe, it, expect, vi, beforeEach } from "vitest";
import { RepaymentsService } from "./repayments.service";
import { ApiError } from "../../lib/api-response";

vi.mock("./repayments.repository", () => ({
    repaymentsRepository: {
        create: vi.fn(),
        findByDebtId: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        getTotalRepaid: vi.fn(),
    },
}));

vi.mock("../debts/debts.repository", () => ({
    debtsRepository: {
        findById: vi.fn(),
        updateStatus: vi.fn(),
    },
}));

vi.mock("../accounts/accounts.repository", () => ({
    accountsRepository: {
        adjustBalance: vi.fn(),
    },
}));

import { repaymentsRepository } from "./repayments.repository";
import { debtsRepository } from "../debts/debts.repository";

const USER_ID = "user-123";

describe("RepaymentsService", () => {
    let service: RepaymentsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new RepaymentsService();
    });

    describe("create", () => {
        it("should create a repayment when within pending amount", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                type: "BORROW",
                totalAmount: "1000.00",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(500);
            vi.mocked(repaymentsRepository.create).mockResolvedValue({
                id: "rep-1",
                amount: "200.00",
            } as any);

            const result = await service.create(
                {
                    debtId: "debt-1",
                    amount: 200,
                    repaymentDate: new Date(),
                },
                USER_ID
            );

            expect(result.id).toBe("rep-1");
            expect(debtsRepository.updateStatus).toHaveBeenCalledWith(
                USER_ID,
                "debt-1",
                "PENDING"
            );
        });

        it("should mark debt as COMPLETED when fully repaid", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                type: "BORROW",
                totalAmount: "1000.00",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(700);
            vi.mocked(repaymentsRepository.create).mockResolvedValue({
                id: "rep-1",
                amount: "300.00",
            } as any);

            await service.create(
                {
                    debtId: "debt-1",
                    amount: 300,
                    repaymentDate: new Date(),
                },
                USER_ID
            );

            expect(debtsRepository.updateStatus).toHaveBeenCalledWith(
                USER_ID,
                "debt-1",
                "COMPLETED"
            );
        });

        it("should throw 404 if debt not found", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue(null);

            await expect(
                service.create(
                    {
                        debtId: "nonexistent",
                        amount: 100,
                        repaymentDate: new Date(),
                    },
                    USER_ID
                )
            ).rejects.toThrow(ApiError);
        });

        it("should throw 400 if repayment exceeds pending amount", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                type: "BORROW",
                totalAmount: "1000.00",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(900);

            await expect(
                service.create(
                    {
                        debtId: "debt-1",
                        amount: 200, // Only 100 pending
                        repaymentDate: new Date(),
                    },
                    USER_ID
                )
            ).rejects.toThrow(ApiError);
        });
    });

    describe("findById", () => {
        it("should return a repayment when it belongs to user's debt", async () => {
            vi.mocked(repaymentsRepository.findById).mockResolvedValue({
                id: "rep-1",
                debtId: "debt-1",
            } as any);
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
            } as any);

            const result = await service.findById(USER_ID, "rep-1");
            expect(result.id).toBe("rep-1");
        });

        it("should throw 404 if repayment not found", async () => {
            vi.mocked(repaymentsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });

        it("should throw 404 if debt not found (cross-user)", async () => {
            vi.mocked(repaymentsRepository.findById).mockResolvedValue({
                id: "rep-1",
                debtId: "debt-1",
            } as any);
            vi.mocked(debtsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findById(USER_ID, "rep-1")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("findByDebtId", () => {
        it("should return repayments for a given debt", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
            } as any);
            vi.mocked(repaymentsRepository.findByDebtId).mockResolvedValue([
                { id: "rep-1" },
                { id: "rep-2" },
            ] as any);

            const result = await service.findByDebtId(USER_ID, "debt-1");
            expect(result).toHaveLength(2);
        });

        it("should throw 404 if debt not found", async () => {
            vi.mocked(debtsRepository.findById).mockResolvedValue(null);

            await expect(
                service.findByDebtId(USER_ID, "nonexistent")
            ).rejects.toThrow(ApiError);
        });
    });

    describe("update", () => {
        it("should update a repayment within limits", async () => {
            // findById flow: repayment exists, debt exists
            vi.mocked(repaymentsRepository.findById).mockResolvedValue({
                id: "rep-1",
                debtId: "debt-1",
                amount: "200.00",
            } as any);
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                type: "LENT",
                totalAmount: "1000.00",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(500);
            vi.mocked(repaymentsRepository.update).mockResolvedValue({
                id: "rep-1",
                amount: "300.00",
            } as any);

            const result = await service.update(USER_ID, "rep-1", {
                amount: 300,
            });

            expect(result.amount).toBe("300.00");
        });

        it("should throw 400 if updated amount exceeds pending", async () => {
            vi.mocked(repaymentsRepository.findById).mockResolvedValue({
                id: "rep-1",
                debtId: "debt-1",
                amount: "100.00",
            } as any);
            vi.mocked(debtsRepository.findById).mockResolvedValue({
                id: "debt-1",
                accountId: "acc-1",
                type: "LENT",
                totalAmount: "500.00",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(400);

            // paidWithoutCurrent = 400 - 100 = 300
            // pending = 500 - 300 = 200
            // newAmount = 300 > 200 → should throw
            await expect(
                service.update(USER_ID, "rep-1", { amount: 300 })
            ).rejects.toThrow(ApiError);
        });
    });

    describe("delete", () => {
        it("should delete a repayment and re-evaluate debt status", async () => {
            vi.mocked(repaymentsRepository.findById).mockResolvedValue({
                id: "rep-1",
                debtId: "debt-1",
            } as any);
            // First call: for findById access check, second call: for post-delete status
            vi.mocked(debtsRepository.findById)
                .mockResolvedValueOnce({ id: "debt-1", accountId: "acc-1", type: "LENT" } as any)
                .mockResolvedValueOnce({
                    id: "debt-1",
                    accountId: "acc-1",
                    type: "LENT",
                    totalAmount: "1000.00",
                } as any);
            vi.mocked(repaymentsRepository.delete).mockResolvedValue({
                id: "rep-1",
            } as any);
            vi.mocked(repaymentsRepository.getTotalRepaid).mockResolvedValue(500);

            await service.delete(USER_ID, "rep-1");

            expect(repaymentsRepository.delete).toHaveBeenCalledWith("rep-1");
            expect(debtsRepository.updateStatus).toHaveBeenCalledWith(
                USER_ID,
                "debt-1",
                "PENDING"
            );
        });
    });
});
