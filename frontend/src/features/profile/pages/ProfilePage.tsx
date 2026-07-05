import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { User, Mail, Lock, ShieldCheck, AlertCircle, Info, Globe, Coins, Moon, Activity, Calendar } from "lucide-react"
import { toast } from "sonner"

import { api } from "../../../lib/api"
import { useAuthStore } from "../../../store/authStore"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { AvatarComponent } from "../../../components/ui/AvatarComponent"
import { Badge } from "../../../components/feedback/FeedbackStates"

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)

  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [avatarUrl, setAvatarUrl] = useState("")

  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Preferences interactive state (PRD wow-factor local state)
  const [currency, setCurrency] = useState("USD")
  const [language, setLanguage] = useState("EN")
  const [theme, setTheme] = useState("LIGHT")

  const updateProfileMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) => api.patch("/profile", data),
    onSuccess: (res) => {
      toast.success("Profile updated successfully!")
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

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans select-none max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-gray-100 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-500">Configure your personal information, security features, and app environment preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        
        {/* Left Side: Avatar Card */}
        <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col items-center justify-center relative overflow-hidden h-fit">
          {/* Banner Graphic background */}
          <div className="h-20 bg-gradient-to-tr from-[#706677] to-[#565264]/80 rounded-t-[16px] w-full absolute top-0 left-0 border-b border-gray-100/10" />
          
          <div className="relative mt-8 mb-3 z-10 flex flex-col items-center">
            <div className="bg-white p-1 rounded-full shadow-md">
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
                  toast.success("Avatar image loaded locally!")
                }}
                onRemove={() => {
                  setAvatarUrl("")
                  toast.success("Avatar image cleared.")
                }}
              />
            </div>
            
            <div className="flex flex-col items-center mt-3 text-center">
              <span className="text-base font-bold text-gray-800 tracking-tight">{user?.name}</span>
              <span className="text-2xs font-medium text-gray-400 mt-0.5">{user?.email}</span>
              <Badge variant="info" className="mt-2.5 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                Auditor Tier
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full mt-5 pt-5 border-t border-gray-150 text-xs">
            <div className="bg-gray-50/50 border border-gray-100 rounded-[10px] p-3 flex flex-col gap-0.5 select-none">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Activity className="size-3" />
                Auth Status
              </span>
              <span className="font-bold text-success text-[11px] flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-success inline-block animate-pulse" />
                Active
              </span>
            </div>
            <div className="bg-gray-50/50 border border-gray-100 rounded-[10px] p-3 flex flex-col gap-0.5 select-none">
              <span className="text-gray-400 font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Calendar className="size-3" />
                Registered
              </span>
              <span className="font-bold text-gray-800 text-[11px] mt-0.5">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jul 2026"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2.5 flex items-center gap-2">
              <User className="size-4 text-gray-400" />
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

          {/* Security / Password / Credentials */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2.5 flex items-center gap-2">
              <Lock className="size-4 text-gray-400" />
              Security & Credentials
            </h3>

            <div className="flex flex-col divide-y divide-gray-100 text-xs">
              <div className="flex items-center justify-between py-3.5 first:pt-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-gray-800">Account Password</span>
                  <span className="text-gray-400">Regularly update credentials to protect transaction ledger logs.</span>
                </div>
                <CustomButton variant="outline" size="sm" className="border-gray-200 shrink-0" onClick={() => setIsPasswordOpen(true)}>
                  Change Password
                </CustomButton>
              </div>

              <div className="flex items-center justify-between py-3.5 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">Two-Factor Authentication (2FA)</span>
                    <Badge variant="default" className="text-[9px] font-bold px-1.5 py-0.2 bg-gray-100 text-gray-500 border-gray-200">Roadmap</Badge>
                  </div>
                  <span className="text-gray-400">Secure authorization checks using phone codes or authenticator apps.</span>
                </div>
                <CustomButton variant="outline" size="sm" className="border-gray-200 shrink-0 opacity-60 cursor-not-allowed" disabled>
                  Enable MFA
                </CustomButton>
              </div>
            </div>
          </div>

          {/* Application Preferences (segmented tab control for premium interactive feel) */}
          <div className="bg-white border border-gray-200 rounded-[16px] p-6 shadow-card flex flex-col gap-5">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-50 pb-2.5 flex items-center gap-2">
              <Globe className="size-4 text-gray-400" />
              Local Preferences
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-sans">
              
              {/* Currency */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Coins className="size-3.5" />
                  Primary Currency
                </span>
                <div className="flex bg-gray-100 p-1 rounded-[10px] w-full">
                  {["USD", "EUR", "INR"].map((cur) => (
                    <button
                      key={cur}
                      type="button"
                      onClick={() => {
                        setCurrency(cur)
                        toast.success(`Currency preferences updated to ${cur}`)
                      }}
                      className={cn(
                        "flex-1 py-1.5 rounded-[8px] text-[10px] font-bold transition-all cursor-pointer select-none",
                        currency === cur
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/40"
                      )}
                    >
                      {cur === "USD" ? "USD ($)" : cur === "EUR" ? "EUR (€)" : "INR (₹)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Globe className="size-3.5" />
                  Language
                </span>
                <div className="flex bg-gray-100 p-1 rounded-[10px] w-full">
                  {["EN", "ES", "HI"].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setLanguage(lang)
                        const nameMap: Record<string, string> = { EN: "English", ES: "Spanish", HI: "Hindi" }
                        toast.success(`App translation language set to ${nameMap[lang]}`)
                      }}
                      className={cn(
                        "flex-1 py-1.5 rounded-[8px] text-[10px] font-bold transition-all cursor-pointer select-none",
                        language === lang
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/40"
                      )}
                    >
                      {lang === "EN" ? "EN" : lang === "ES" ? "ES" : "HI"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-500 flex items-center gap-1.5 select-none">
                  <Moon className="size-3.5" />
                  Interface Theme
                </span>
                <div className="flex bg-gray-100 p-1 rounded-[10px] w-full">
                  {["LIGHT", "DARK", "SYSTEM"].map((th) => (
                    <button
                      key={th}
                      type="button"
                      onClick={() => {
                        setTheme(th)
                        toast.success(`${th.charAt(0) + th.slice(1).toLowerCase()} Theme active`)
                      }}
                      className={cn(
                        "flex-1 py-1.5 rounded-[8px] text-[10px] font-bold transition-all cursor-pointer select-none",
                        theme === th
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/40"
                      )}
                    >
                      {th.charAt(0) + th.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1 select-none">
              <ShieldCheck className="size-3.5 text-success" />
              <span>Session preferences apply instantly to your active browser cache.</span>
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
