import { useQuery } from "@tanstack/react-query"
import { paymentMethodsApi } from "../api/paymentMethodsApi"
import type { PaymentMethod } from "../api/paymentMethodsApi"

export function usePaymentMethodsList() {
  return useQuery<PaymentMethod[]>({
    queryKey: ["paymentMethods"],
    queryFn: () => paymentMethodsApi.getAll(),
    staleTime: 60 * 60 * 1000, // Long stale time for static lookup data
  })
}
