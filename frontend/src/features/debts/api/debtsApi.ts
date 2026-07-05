import { api } from "../../../lib/api"

export interface Debt {
  id: string
  partyName: string
  totalAmount: number
  remainingAmount: number
  type: "LENT" | "BORROW"
  debtDate: string
  dueDate?: string
  status: "PENDING" | "COMPLETED"
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Repayment {
  id: string
  debtId: string
  amount: number
  repaymentDate: string
  note?: string
  createdAt: string
  updatedAt: string
}

export const debtsApi = {
  getAll: async (type?: "LENT" | "BORROW"): Promise<Debt[]> => {
    const res = await api.get("/debts", { params: { type } })
    return res.data.data
  },

  create: async (data: {
    partyName: string
    totalAmount: number
    type: "LENT" | "BORROW"
    debtDate: string
    dueDate?: string
    notes?: string
    accountId: string
  }): Promise<Debt> => {
    const res = await api.post("/debts", data)
    return res.data.data
  },

  update: async (id: string, data: Partial<{
    partyName: string
    totalAmount: number
    type: "LENT" | "BORROW"
    debtDate: string
    dueDate?: string
    notes?: string
  }>): Promise<Debt> => {
    const res = await api.patch(`/debts/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/debts/${id}`)
  },

  // Repayments Sub-API (Section 75)
  getRepayments: async (debtId: string): Promise<Repayment[]> => {
    const res = await api.get("/repayments", { params: { debtId } })
    return res.data.data
  },

  createRepayment: async (data: {
    debtId: string
    amount: number
    repaymentDate: string
    note?: string
  }): Promise<Repayment> => {
    const res = await api.post("/repayments", data)
    return res.data.data
  },
}
