import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";
import { accountsService } from "../accounts/accounts.service";
import { debtsRepository } from "../debts/debts.repository";

import { repaymentsRepository } from "./repayments.repository";
import type {
    CreateRepaymentInput,
    UpdateRepaymentInput,
} from "./repayments.schema";

export class RepaymentsService {
    async create(data: CreateRepaymentInput, userId: string) {
        const debt = await debtsRepository.findById(
            userId,
            data.debtId,
        );

        if (!debt) {
            throw new ApiError(404, "Debt not found.");
        }

        const account = await accountsRepository.findById(
            userId,
            data.accountId,
        );

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        // Enforce account type rules
        if (debt.type === "BORROW") {
            if (account.type !== "CASH" && account.type !== "BANK") {
                throw new ApiError(
                    400,
                    "Borrow repayment must use CASH or BANK accounts.",
                );
            }

            // Spend limits check: BORROW repayment leaves the user's account
            const [populatedAcc] = await accountsService.populateAccountsBalances(userId, [account]);
            if (data.amount > Number(populatedAcc.openingBalance || 0)) {
                throw new ApiError(400, "Repayment exceeds available balance.");
            }
        } else if (debt.type === "LENT") {
            if (
                account.type !== "CASH" &&
                account.type !== "BANK"
            ) {
                throw new ApiError(
                    400,
                    "Lent repayment must use CASH or BANK accounts.",
                );
            }
        }

        const totalRepaid =
            await repaymentsRepository.getTotalRepaid(
                debt.id,
            );

        const pending =
            Number(debt.totalAmount) - totalRepaid;

        if (data.amount > pending) {
            throw new ApiError(
                400,
                "Repayment amount exceeds the pending amount.",
            );
        }

        const repayment =
            await repaymentsRepository.create(data);

        const updatedPaid =
            totalRepaid + data.amount;

        await debtsRepository.updateStatus(
            userId,
            debt.id,
            updatedPaid >= Number(debt.totalAmount)
                ? "COMPLETED"
                : "PENDING",
        );

        return repayment;
    }

    async findByDebtId(
        userId: string,
        debtId: string,
    ) {
        const debt = await debtsRepository.findById(
            userId,
            debtId,
        );

        if (!debt) {
            throw new ApiError(404, "Debt not found.");
        }

        return repaymentsRepository.findByDebtId(
            debtId,
        );
    }

    async findById(
        userId: string,
        repaymentId: string,
    ) {
        const repayment =
            await repaymentsRepository.findById(
                repaymentId,
            );

        if (!repayment) {
            throw new ApiError(
                404,
                "Repayment not found.",
            );
        }

        const debt = await debtsRepository.findById(
            userId,
            repayment.debtId,
        );

        if (!debt) {
            throw new ApiError(
                404,
                "Repayment not found.",
            );
        }

        return repayment;
    }

    async update(
        userId: string,
        repaymentId: string,
        data: UpdateRepaymentInput,
    ) {
        const repayment = await this.findById(
            userId,
            repaymentId,
        );

        const debt = await debtsRepository.findById(
            userId,
            repayment.debtId,
        );

        if (!debt) {
            throw new ApiError(404, "Debt not found.");
        }

        const targetAccountId = data.accountId ?? repayment.accountId;
        const account = await accountsRepository.findById(
            userId,
            targetAccountId,
        );

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        const newAmount = data.amount ?? Number(repayment.amount);

        // Enforce account type rules
        if (debt.type === "BORROW") {
            if (account.type !== "CASH" && account.type !== "BANK") {
                throw new ApiError(
                    400,
                    "Borrow repayment must use CASH or BANK accounts.",
                );
            }

            // Spend limits check
            const [populatedAcc] = await accountsService.populateAccountsBalances(userId, [account]);
            // Re-add old repayment if updating the same account to calculate available limit accurately
            let currentAvailable = Number(populatedAcc.openingBalance || 0);
            if (account.id === repayment.accountId) {
                currentAvailable += Number(repayment.amount);
            }
            if (newAmount > currentAvailable) {
                throw new ApiError(400, "Repayment exceeds available balance.");
            }
        } else if (debt.type === "LENT") {
            if (
                account.type !== "CASH" &&
                account.type !== "BANK"
            ) {
                throw new ApiError(
                    400,
                    "Lent repayment must use CASH or BANK accounts.",
                );
            }
        }

        const totalRepaid =
            await repaymentsRepository.getTotalRepaid(
                debt.id,
            );

        const currentAmount = Number(repayment.amount);

        const paidWithoutCurrent =
            totalRepaid - currentAmount;

        const pending =
            Number(debt.totalAmount) -
            paidWithoutCurrent;

        if (newAmount > pending) {
            throw new ApiError(
                400,
                "Repayment amount exceeds the pending amount.",
            );
        }

        const updated =
            await repaymentsRepository.update(
                repaymentId,
                data,
            );

        const finalPaid =
            paidWithoutCurrent + newAmount;

        await debtsRepository.updateStatus(
            userId,
            debt.id,
            finalPaid >= Number(debt.totalAmount)
                ? "COMPLETED"
                : "PENDING",
        );

        return updated;
    }

    async delete(
        userId: string,
        repaymentId: string,
    ) {
        const repayment = await this.findById(
            userId,
            repaymentId,
        );

        const debt = await debtsRepository.findById(
            userId,
            repayment.debtId,
        );

        if (!debt) {
            throw new ApiError(404, "Debt not found.");
        }

        const deleted =
            await repaymentsRepository.delete(
                repaymentId,
            );

        const totalRepaid =
            await repaymentsRepository.getTotalRepaid(
                debt.id,
            );

        await debtsRepository.updateStatus(
            userId,
            debt.id,
            totalRepaid >= Number(debt.totalAmount)
                ? "COMPLETED"
                : "PENDING",
        );

        return deleted;
    }
}

export const repaymentsService =
    new RepaymentsService();