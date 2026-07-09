import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "../api/analyticsApi"
import type { AnalyticsReport, AnalyticsQueryFilters } from "../api/analyticsApi"

export function useAnalyticsReport(params?: AnalyticsQueryFilters) {
  return useQuery<AnalyticsReport>({
    queryKey: ["analytics", params],
    queryFn: () => analyticsApi.getReport(params),
    staleTime: 5 * 60 * 1000, // Medium cache (Section 87/92)
  })
}
