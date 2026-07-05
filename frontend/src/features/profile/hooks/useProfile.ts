import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { profileApi } from "../api/profileApi"
import type { UserProfile } from "../api/profileApi"
import { toast } from "sonner"
import { useAuthStore } from "../../../store/authStore"

export function useProfileDetails() {
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: profileApi.getProfile,
    staleTime: 15 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((state) => state.setAuth)

  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: (updatedProfile) => {
      toast.success("Profile updated successfully!")
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      
      const accessToken = useAuthStore.getState().accessToken
      const refreshToken = useAuthStore.getState().refreshToken
      setAuth(
        {
          id: updatedProfile.id,
          name: updatedProfile.fullName,
          email: updatedProfile.email,
        },
        accessToken || "",
        refreshToken || ""
      )
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile")
    },
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileApi.updatePreferences,
    onSuccess: (updatedProfile) => {
      toast.success(`Preferences saved to database: ${updatedProfile.currency} / ${updatedProfile.theme}`)
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update preferences")
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed successfully!")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password")
    },
  })
}
