import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { categoriesApi } from "../api/categoriesApi"
import type { Category, CategoryIcon } from "../api/categoriesApi"
import { toast } from "sonner"

export function useCategoriesList(type?: "INCOME" | "EXPENSE") {
  return useQuery<Category[]>({
    queryKey: ["categories", type],
    queryFn: () => categoriesApi.getAll(type),
    staleTime: 30 * 60 * 1000, // Categories change infrequently (Section 87/92)
  })
}

export function useCategoryIcons() {
  return useQuery<CategoryIcon[]>({
    queryKey: ["category-icons"],
    queryFn: () => categoriesApi.getIcons(),
    staleTime: 60 * 60 * 1000, // Very long stale time
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => {
      toast.success("Category created successfully!")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create category")
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => categoriesApi.update(id, data),
    onSuccess: () => {
      toast.success("Category updated!")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update category")
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      toast.success("Category deleted successfully.")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete category")
    },
  })
}
