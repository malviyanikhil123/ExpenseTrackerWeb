import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { debtsApi } from "../api/debtsApi"
import type { Debt, Repayment } from "../api/debtsApi"
import { toast } from "sonner"

export function useDebtsList(filters?: { type?: "LENT" | "BORROW"; status?: "PENDING" | "COMPLETED" }) {
  return useQuery<Debt[]>({
    queryKey: ["debts", filters],
    queryFn: () => debtsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // Short cache (Section 92)
  })
}

export function useCreateDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: debtsApi.create,
    onSuccess: () => {
      toast.success("Debt record created successfully!")
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create debt")
    },
  })
}

export function useUpdateDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => debtsApi.update(id, data),
    onSuccess: () => {
      toast.success("Debt details updated.")
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update debt")
    },
  })
}

export function useDeleteDebt() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: debtsApi.delete,
    onSuccess: () => {
      toast.success("Debt record deleted.")
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete debt")
    },
  })
}

// Repayments mutations (Section 75)
export function useRepaymentsList(debtId: string) {
  return useQuery<Repayment[]>({
    queryKey: ["repayments", debtId],
    queryFn: () => debtsApi.getRepayments(debtId),
    enabled: !!debtId,
  })
}

export function useCreateRepayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: debtsApi.createRepayment,
    onSuccess: (_, variables) => {
      toast.success("Repayment registered successfully!")
      queryClient.invalidateQueries({ queryKey: ["repayments", variables.debtId] })
      queryClient.invalidateQueries({ queryKey: ["debts"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add repayment")
    },
  })
}
