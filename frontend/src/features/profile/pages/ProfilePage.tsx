import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { User, Mail, Lock, ShieldCheck, AlertCircle, Info, Edit, Globe, Coins, Moon } from "lucide-react"
import { toast } from "sonner"

import { api } from "../../../lib/api"
import { useAuthStore } from "../../../store/authStore"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { AvatarComponent } from "../../../components/ui/AvatarComponent"

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatarUrl, setAvatarUrl] = useState("")

  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => api.patch("/profile", data),
    onSuccess: (res) => {
      toast.success("Profile updated successfully!")
      // Sync back with authStore
      const updatedUser = res.data.data
      const accessToken = useAuthStore.getState().accessToken
      const refreshToken = useAuthStore.getState().refreshToken
      setAuth(updatedUser, accessToken || "", refreshToken || "")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update profile")
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.post("/profile/change-password", data),
    onSuccess: () => {
      toast.success("Password changed successfully!")
      setIsPasswordOpen(false)
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to change password")
    },
  })

  const handleSaveInfo = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required.")
      return
    }
    updateProfileMutation.mutate({
      name: name.trim(),
      email: email.trim(),
    })
  }

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please fill out all password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.")
      return
    }
    changePasswordMutation.mutate({
      oldPassword,
      newPassword,
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans select-none max-w-4xl">
      
      {/* Header (Section 77) */}
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500">Manage your avatar, personal information, and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
        
        {/* Left Side: Avatar Panel */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col items-center justify-center gap-4 text-center">
          <AvatarComponent
            src={avatarUrl || undefined}
            initials={user?.name || "Member"}
            size="lg"
            editable={true}
            onUpload={(file) => {
              const reader = new FileReader()
              reader.onloadend = () => {
                setAvatarUrl(reader.result as string)
              }
              reader.readAsDataURL(file)
              toast.success("Photo uploaded successfully!")
            }}
            onRemove={() => {
              setAvatarUrl("")
              toast.success("Photo removed.")
            }}
          />
          <div className="flex flex-col mt-2">
            <span className="text-sm font-semibold text-gray-800">{user?.name}</span>
            <span className="text-2xs text-gray-400 mt-0.5">{user?.email}</span>
          </div>
          <p className="text-2xs text-gray-400 max-w-[200px] leading-normal mt-1">
            Drag-and-drop or select an image file to update your profile photo representation.
          </p>
        </div>

        {/* Right Side: Forms (Personal Information & Security) */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-2">
              <User className="size-4.5 text-gray-400" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CustomInput
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
              />
              <CustomInput
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@example.com"
                type="email"
              />
            </div>

            <div className="flex justify-end border-t border-gray-50 pt-4 mt-1">
              <CustomButton
                variant="primary"
                size="sm"
                onClick={handleSaveInfo}
                isLoading={updateProfileMutation.isPending}
              >
                Save Changes
              </CustomButton>
            </div>
          </div>

          {/* Security / Preferences */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-2">
              <Lock className="size-4.5 text-gray-400" />
              Security & Credentials
            </h3>

            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-gray-800">Account Password</span>
                <span className="text-gray-400">Regularly update credentials to protect ledger records.</span>
              </div>
              <CustomButton variant="outline" size="sm" onClick={() => setIsPasswordOpen(true)}>
                Change Password
              </CustomButton>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2 flex items-center gap-2">
              <Globe className="size-4.5 text-gray-400" />
              Preferences (Future Ready)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Coins className="size-3.5" />
                  Primary Currency
                </span>
                <select className="h-9 px-3 border border-gray-200 rounded-[10px] bg-gray-50 text-gray-400 cursor-not-allowed outline-none" disabled>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>INR (₹)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Globe className="size-3.5" />
                  Language
                </span>
                <select className="h-9 px-3 border border-gray-200 rounded-[10px] bg-gray-50 text-gray-400 cursor-not-allowed outline-none" disabled>
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>Hindi</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Moon className="size-3.5" />
                  Interface Theme
                </span>
                <select className="h-9 px-3 border border-gray-200 rounded-[10px] bg-gray-50 text-gray-400 cursor-not-allowed outline-none" disabled>
                  <option>Light Mode</option>
                  <option>Dark Mode</option>
                  <option>System Sync</option>
                </select>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Change Password Dialog */}
      <CustomDialog
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
        title="Change Password"
        description="Verify security settings to update authentication credentials."
        footer={
          <>
            <CustomButton variant="outline" size="sm" onClick={() => setIsPasswordOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleChangePassword}
              isLoading={changePasswordMutation.isPending}
            >
              Update Password
            </CustomButton>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2 font-sans text-xs">
          <CustomInput
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
          />
          <CustomInput
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <CustomInput
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </CustomDialog>

    </div>
  )
}
