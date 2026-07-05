import { api } from "../../../lib/api"

export interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
  categoryIconId: string
  color?: string
  isArchived: boolean
}

export interface CategoryIcon {
  id: string
  displayName: string
  iconKey: string
  type: "INCOME" | "EXPENSE"
}

export const categoriesApi = {
  getAll: async (type?: "INCOME" | "EXPENSE"): Promise<Category[]> => {
    const res = await api.get("/categories", { params: { type } })
    return res.data.data
  },

  getIcons: async (): Promise<CategoryIcon[]> => {
    const res = await api.get("/categories/icons")
    return res.data.data
  },

  create: async (data: { name: string; type: "INCOME" | "EXPENSE"; categoryIconId: string; color?: string }): Promise<Category> => {
    const res = await api.post("/categories", data)
    return res.data.data
  },

  update: async (id: string, data: { name?: string; type?: "INCOME" | "EXPENSE"; categoryIconId?: string; color?: string }): Promise<Category> => {
    const res = await api.patch(`/categories/${id}`, data)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
