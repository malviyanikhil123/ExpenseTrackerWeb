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

    const debt = await debtsRepository.create(userId, data);

    // LENT: money leaves (-), BORROW: money arrives (+)
    const delta =
      data.type === "BORROW"
        ? data.totalAmount
        : -data.totalAmount;

    await accountsRepository.adjustBalance(
      userId,
      data.accountId,
      delta,
    );

    return debt;
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

    // Reverse old debt's effect on old account
    const oldDelta =
      debt.type === "BORROW"
        ? -Number(debt.totalAmount)
        : Number(debt.totalAmount);

    await accountsRepository.adjustBalance(
      userId,
      debt.accountId,
      oldDelta,
    );

    const updated = await debtsRepository.update(
      userId,
      debtId,
      data,
    );

    // Apply new debt's effect on new account
    const newType = data.type ?? debt.type;
    const newAmount =
      data.totalAmount ?? Number(debt.totalAmount);
    const newDelta =
      newType === "BORROW" ? newAmount : -newAmount;

    await accountsRepository.adjustBalance(
      userId,
      accountId,
      newDelta,
    );

    return updated;
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

    // Reverse original debt creation effect
    // LENT creation was -, so reverse is +
    // BORROW creation was +, so reverse is -
    const reverseDelta =
      debt.type === "BORROW"
        ? -Number(debt.totalAmount)
        : Number(debt.totalAmount);

    await accountsRepository.adjustBalance(
      userId,
      debt.accountId,
      reverseDelta,
    );

    return debtsRepository.softDelete(
      userId,
      debtId,
    );
  }
}

export const debtsService =
  new DebtsService();