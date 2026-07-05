import { create } from "zustand"

export interface User {
  id: string
  name: string
  email: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  updateAccessToken: (accessToken: string, refreshToken: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => {
  // Read initial state from localStorage
  const storedUser = localStorage.getItem("user")
  const storedAccess = localStorage.getItem("accessToken")
  const storedRefresh = localStorage.getItem("refreshToken")

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    accessToken: storedAccess,
    refreshToken: storedRefresh,
    isAuthenticated: Boolean(storedAccess),

    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem("user", JSON.stringify(user))
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      set({ user, accessToken, refreshToken, isAuthenticated: true })
    },

    updateAccessToken: (accessToken, refreshToken) => {
      localStorage.setItem("accessToken", accessToken)
      localStorage.setItem("refreshToken", refreshToken)
      set({ accessToken, refreshToken, isAuthenticated: true })
    },

    clearAuth: () => {
      localStorage.removeItem("user")
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
    },
  }
})
