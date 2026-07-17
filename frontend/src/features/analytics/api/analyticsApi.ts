import { api } from "../../../lib/api"

export interface AnalyticsReport {
  income: number
  expense: number
  balance: number
  savings: number
  monthlyTrend: any[]
  categoryBreakdown: any[]
  accountBreakdown: any[]
  paymentMethodBreakdown: any[]
}

export interface AnalyticsQueryFilters {
  period?: "WEEK" | "MONTH" | "YEAR" | "CUSTOM"
  startDate?: string
  endDate?: string
  accountId?: string
  categoryId?: string
  paymentMethodId?: string
}


export const analyticsApi = {
  getReport: async (params?: AnalyticsQueryFilters): Promise<AnalyticsReport> => {
    const res = await api.get("/analytics", { params })
    return res.data.data
  },
}
