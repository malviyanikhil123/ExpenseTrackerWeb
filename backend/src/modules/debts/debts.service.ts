import { ApiError } from "../../lib/api-response";

import { accountsRepository } from "../accounts/accounts.repository";

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

    return debtsRepository.create(userId, data);
  }

  async findAll(
    userId: string,
    query: DebtQueryInput,
  ) {
    return debtsRepository.findAll(userId, query);
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

    return debt;
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

    return debtsRepository.update(
      userId,
      debtId,
      data,
    );
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