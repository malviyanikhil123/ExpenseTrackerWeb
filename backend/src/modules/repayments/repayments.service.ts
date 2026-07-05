import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";
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

        // LENT repayment: money returns to user (+)
        // BORROW repayment: money leaves user (-)
        const delta =
            debt.type === "LENT"
                ? data.amount
                : -data.amount;

        await accountsRepository.adjustBalance(
            userId,
            debt.accountId,
            delta,
        );

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

        const totalRepaid =
            await repaymentsRepository.getTotalRepaid(
                debt.id,
            );

        const currentAmount = Number(repayment.amount);

        const newAmount =
            data.amount ?? currentAmount;

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

        // Reverse old repayment's balance effect
        const oldDelta =
            debt.type === "LENT"
                ? -currentAmount
                : currentAmount;

        await accountsRepository.adjustBalance(
            userId,
            debt.accountId,
            oldDelta,
        );

        const updated =
            await repaymentsRepository.update(
                repaymentId,
                data,
            );

        // Apply new repayment's balance effect
        const newDelta =
            debt.type === "LENT"
                ? newAmount
                : -newAmount;

        await accountsRepository.adjustBalance(
            userId,
            debt.accountId,
            newDelta,
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

        // Reverse repayment's balance effect
        const reverseDelta =
            debt.type === "LENT"
                ? -Number(repayment.amount)
                : Number(repayment.amount);

        await accountsRepository.adjustBalance(
            userId,
            debt.accountId,
            reverseDelta,
        );

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