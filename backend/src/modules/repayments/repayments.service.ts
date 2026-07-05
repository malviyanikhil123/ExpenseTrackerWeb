import { ApiError } from "../../lib/api-response";

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

        const deleted =
            await repaymentsRepository.delete(
                repaymentId,
            );

        const debt = await debtsRepository.findById(
            userId,
            repayment.debtId,
        );

        if (debt) {
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
        }

        return deleted;
    }
}

export const repaymentsService =
    new RepaymentsService();