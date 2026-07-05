import { api } from "../../../lib/api"

export interface UserProfile {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  currency: string
  theme: "LIGHT" | "DARK" | "SYSTEM"
  createdAt: string
}

export const profileApi = {
  getProfile: async (): Promise<UserProfile> => {
    const res = await api.get("/profile")
    return res.data.data
  },

  updateProfile: async (data: { fullName?: string; avatarUrl?: string }): Promise<UserProfile> => {
    const res = await api.patch("/profile", data)
    return res.data.data
  },

  updatePreferences: async (data: { currency: string; theme: "LIGHT" | "DARK" | "SYSTEM" }): Promise<UserProfile> => {
    const res = await api.patch("/profile/preferences", data)
    return res.data.data
  },

  changePassword: async (data: any): Promise<void> => {
    await api.patch("/profile/password", data)
  },
}
