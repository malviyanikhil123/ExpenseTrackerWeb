import { api } from "../../../lib/api"

export interface Transaction {
  id: string
  accountId: string
  categoryId?: string | null
  type: "INCOME" | "EXPENSE" | "TRANSFER"
  amount: number
  transactionDate: string
  note?: string
  attachmentUrl?: string
  destinationAccountId?: string | null
  createdAt: string
  updatedAt: string
}

export interface TransactionsQueryFilters {
  type?: "INCOME" | "EXPENSE" | "TRANSFER"
  accountId?: string
  categoryId?: string
  startDate?: string
  endDate?: string
}

export const transactionsApi = {
  getAll: async (filters?: TransactionsQueryFilters): Promise<Transaction[]> => {
    const res = await api.get("/transactions", { params: filters })
    return res.data.data
  },

  create: async (data: {
    accountId: string
    categoryId?: string
    type: "INCOME" | "EXPENSE" | "TRANSFER"
    amount: number
    transactionDate: string
    note?: string
    attachmentUrl?: string
    destinationAccountId?: string
  }): Promise<Transaction> => {
    const res = await api.post("/transactions", data)
    return res.data.data
  },

  update: async (id: string, data: Partial<{
    accountId: string
    categoryId?: string
    type: "INCOME" | "EXPENSE" | "TRANSFER"
    amount: number
    transactionDate: string
    note?: string
    attachmentUrl?: string
    destinationAccountId?: string
  }>): Promise<Transaction> => {
    const res = await api.patch(`/transactions/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`)
  },
}
