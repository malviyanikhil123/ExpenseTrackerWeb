import { api } from "../../../lib/api"

export interface Account {
  id: string
  name: string
  type: "CASH" | "BANK" | "E_WALLET" | "UPI" | "CREDIT_CARD" | "DEBIT_CARD"
  openingBalance: number
  description?: string
  color?: string
  isDefault: boolean
  isArchived: boolean
  createdAt: string
  updatedAt: string
  creditLimit?: number
  statementDate?: number
  dueDate?: number
  linkedBankAccountId?: string
  outstanding?: number
  availableCredit?: number
}

export const accountsApi = {
  getAll: async (archived?: boolean): Promise<Account[]> => {
    const res = await api.get("/accounts", { params: { archived } })
    return res.data.data
  },

  create: async (data: {
    name: string
    type: Account["type"]
    openingBalance: number
    description?: string
    color?: string
    isDefault?: boolean
    creditLimit?: number
    statementDate?: number
    dueDate?: number
    linkedBankAccountId?: string
  }): Promise<Account> => {
    const res = await api.post("/accounts", data)
    return res.data.data
  },

  update: async (id: string, data: {
    name?: string
    type?: Account["type"]
    description?: string
    color?: string
    isDefault?: boolean
    isArchived?: boolean
    creditLimit?: number
    statementDate?: number
    dueDate?: number
    linkedBankAccountId?: string
  }): Promise<Account> => {
    const res = await api.patch(`/accounts/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounts/${id}`)
  },
}
