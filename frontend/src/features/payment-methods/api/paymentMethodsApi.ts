import { api } from "../../../lib/api"

export interface PaymentMethod {
  id: string
  name: string
  code: string
  icon?: string
  isActive: boolean
  createdAt: string
}

export const paymentMethodsApi = {
  getAll: async (): Promise<PaymentMethod[]> => {
    const res = await api.get("/payment-methods")
    return res.data.data
  },
}
