import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";
import { repaymentsRepository } from "../repayments/repayments.repository";

import { debtsRepository } from "./debts.repository";
import type {
  CreateDebtInput,
  DebtQueryInput,
  UpdateDebtInput,
} from "./debts.schema";

export class DebtsService {
  async create(
    userId: string,
    data: CreateDebtInput,
  ) {
    const account = await accountsRepository.findById(
      userId,
      data.accountId,
    );

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    const debt = await debtsRepository.create(userId, data);

    return {
      ...debt,
      remainingAmount: Number(debt.totalAmount),
    };
  }

  async findAll(
    userId: string,
    query: DebtQueryInput,
  ) {
    const debtsList = await debtsRepository.findAll(userId, query);
    return Promise.all(
      debtsList.map(async (debt) => {
        const totalRepaid = await repaymentsRepository.getTotalRepaid(debt.id);
        return {
          ...debt,
          remainingAmount: Number(debt.totalAmount) - totalRepaid,
        };
      })
    );
  }

  async findById(
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

    const totalRepaid = await repaymentsRepository.getTotalRepaid(debt.id);
    return {
      ...debt,
      remainingAmount: Number(debt.totalAmount) - totalRepaid,
    };
  }

  async update(
    userId: string,
    debtId: string,
    data: UpdateDebtInput,
  ) {
    const debt = await this.findById(
      userId,
      debtId,
    );

    if (debt.status === "COMPLETED") {
      throw new ApiError(
        400,
        "Completed debt cannot be updated.",
      );
    }

    const accountId =
      data.accountId ?? debt.accountId;

    const account = await accountsRepository.findById(
      userId,
      accountId,
    );

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    const updated = await debtsRepository.update(
      userId,
      debtId,
      data,
    );

    const totalRepaid = await repaymentsRepository.getTotalRepaid(debtId);
    return {
      ...updated,
      remainingAmount: Number(updated.totalAmount) - totalRepaid,
    };
  }

  async delete(
    userId: string,
    debtId: string,
  ) {
    const debt = await this.findById(
      userId,
      debtId,
    );

    if (debt.status === "COMPLETED") {
      throw new ApiError(
        400,
        "Completed debt cannot be deleted.",
      );
    }

    return debtsRepository.softDelete(
      userId,
      debtId,
    );
  }
}

export const debtsService =
  new DebtsService();