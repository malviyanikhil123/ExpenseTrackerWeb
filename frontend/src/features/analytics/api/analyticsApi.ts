import { api } from "../../../lib/api"

export interface AnalyticsReport {
  income: number
  expense: number
  balance: number
  savings: number
  monthlyTrend: any[]
  categoryBreakdown: any[]
  accountBreakdown: any[]
}

export const analyticsApi = {
  getReport: async (params?: { startDate?: string; endDate?: string }): Promise<AnalyticsReport> => {
    const res = await api.get("/analytics", { params })
    return res.data.data
  },
}
