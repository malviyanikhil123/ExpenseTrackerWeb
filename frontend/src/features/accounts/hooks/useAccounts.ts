import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { accountsApi } from "../api/accountsApi"
import type { Account } from "../api/accountsApi"
import { toast } from "sonner"

export function useAccountsList(archived?: boolean) {
  return useQuery<Account[]>({
    queryKey: ["accounts", archived],
    queryFn: () => accountsApi.getAll(archived),
    staleTime: 10 * 60 * 1000, // Medium stale time (Section 87)
  })
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: async (createdAccount) => {
      toast.success("Account created successfully!")
      queryClient.setQueriesData({ queryKey: ["accounts"] }, (current: any) => {
        if (!Array.isArray(current)) {
          return current
        }

        return [...current, createdAccount]
      })
      await queryClient.refetchQueries({ queryKey: ["accounts"] })
      await queryClient.refetchQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create account")
    },
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => accountsApi.update(id, data),
    onSuccess: async () => {
      toast.success("Account updated successfully!")
      await queryClient.refetchQueries({ queryKey: ["accounts"] })
      await queryClient.refetchQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update account")
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: async () => {
      toast.success("Account deleted.")
      await queryClient.refetchQueries({ queryKey: ["accounts"] })
      await queryClient.refetchQueries({ queryKey: ["dashboard"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete account")
    },
  })
}
