import { api } from "../../../lib/api"

export interface Debt {
  id: string
  partyName: string
  phoneNumber?: string | null
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
  accountId: string
  amount: number
  repaymentDate: string
  note?: string
  createdAt: string
  updatedAt: string
}

export const debtsApi = {
  getAll: async (params?: { type?: "LENT" | "BORROW"; status?: "PENDING" | "COMPLETED" }): Promise<Debt[]> => {
    const res = await api.get("/debts", { params })
    return res.data.data
  },

  getOne: async (id: string): Promise<Debt> => {
    const res = await api.get(`/debts/${id}`)
    return res.data.data
  },

  create: async (data: {
    partyName: string
    phoneNumber?: string
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
    phoneNumber?: string | null
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
    accountId: string
    amount: number
    repaymentDate: string
    note?: string
  }): Promise<Repayment> => {
    const res = await api.post("/repayments", data)
    return res.data.data
  },
}
