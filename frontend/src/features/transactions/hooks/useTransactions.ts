import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { transactionsApi } from "../api/transactionsApi"
import type { Transaction, TransactionsQueryFilters } from "../api/transactionsApi"
import { toast } from "sonner"

export function useTransactionsList(filters?: TransactionsQueryFilters) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", filters],
    queryFn: () => transactionsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // Short cache (Section 87/92)
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      toast.success("Transaction added successfully!")
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add transaction")
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => transactionsApi.update(id, data),
    onSuccess: () => {
      toast.success("Transaction updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update transaction")
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      toast.success("Transaction deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete transaction")
    },
  })
}
