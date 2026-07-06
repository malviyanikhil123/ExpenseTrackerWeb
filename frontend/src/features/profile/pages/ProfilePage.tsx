import { useState, useEffect } from "react"
import { User, Mail, Lock, ShieldCheck, AlertCircle, Info, Globe, Coins, Moon, Activity, Calendar } from "lucide-react"
import { toast } from "sonner"

import { useAuthStore } from "../../../store/authStore"
import { CustomButton } from "../../../components/buttons/CustomButton"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomDialog } from "../../../components/dialogs/CustomDialog"
import { AvatarComponent } from "../../../components/ui/AvatarComponent"
import { Badge } from "../../../components/feedback/FeedbackStates"
import {
  useProfileDetails,
  useUpdateProfile,
  useUpdatePreferences,
  useChangePassword,
} from "../hooks/useProfile"
import { useTheme } from "../../../context/ThemeContext"

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  const { data: profile, isLoading, isError, refetch } = useProfileDetails()

  const [name, setName] = useState(() => profile?.fullName || "")
  const [email, setEmail] = useState(() => profile?.email || "")
  const [avatarUrl, setAvatarUrl] = useState(() => profile?.avatarUrl || "")

  const [isPasswordOpen, setIsPasswordOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Preferences interactive state (linked to backend userSettings)
  const [currency, setCurrency] = useState(() => profile?.currency || localStorage.getItem("currency") || "USD")
  const [language, setLanguage] = useState("EN")
  const { theme, setTheme } = useTheme()

  // Sync state once profile is loaded (Section 77)
  useEffect(() => {
    if (profile) {
      setName(profile.fullName)
      setEmail(profile.email)
      setAvatarUrl(profile.avatarUrl || "")
      setCurrency(profile.currency || localStorage.getItem("currency") || "USD")
    }
  }, [profile])

  const updateProfileMutation = useUpdateProfile()
  const updatePreferencesMutation = useUpdatePreferences()
  const changePasswordMutation = useChangePassword()

  const handleSaveInfo = () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required.")
      return
    }
    updateProfileMutation.mutate({
      fullName: name.trim(),
      avatarUrl: avatarUrl || undefined,
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
    changePasswordMutation.mutate(
      {
        currentPassword: oldPassword,
        newPassword,
      },
      {
        onSuccess: () => {
          setIsPasswordOpen(false)
          setOldPassword("")
          setNewPassword("")
          setConfirmPassword("")
        },
      }
    )
  }

  const handleCurrencyChange = (cur: string) => {
    setCurrency(cur)
    localStorage.setItem("currency", cur)
    updatePreferencesMutation.mutate({
      currency: cur,
      theme: theme as any,
    })
  }

  const handleThemeChange = (th: "LIGHT" | "DARK" | "SYSTEM") => {
    setTheme(th)
    updatePreferencesMutation.mutate({
      currency,
      theme: th,
    })
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border border-danger/10 bg-danger/5 rounded-[16px] max-w-2xl mx-auto mt-12">
        <AlertCircle className="size-12 text-danger mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-1">Failed to fetch profile settings</h2>
        <p className="text-sm text-gray-500 mb-6">There was an error communicating with the database service.</p>
        <CustomButton variant="outline" onClick={() => refetch()}>
          Retry Request
        </CustomButton>
      </div>
    )
  }

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }

  return (
    <div className="flex flex-col gap-6 pb-12 font-sans select-none max-w-4xl">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your personal information, security features, and app environment preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        
        {/* Left Side: Avatar Card */}
        <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col items-center justify-center relative overflow-hidden h-fit text-card-foreground">
          {/* Banner Graphic background */}
          <div className="h-20 bg-secondary rounded-t-[16px] w-full absolute top-0 left-0 border-b border-border/10" />
          
          <div className="relative mt-8 mb-3 z-10 flex flex-col items-center w-full">
            <AvatarComponent
              src={avatarUrl || undefined}
              initials={user?.name || "Member"}
              size="lg"
              editable={true}
              onUpload={(file) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                  const loadedUrl = reader.result as string
                  setAvatarUrl(loadedUrl)
                  updateProfileMutation.mutate({ avatarUrl: loadedUrl })
                }
                reader.readAsDataURL(file)
              }}
              onRemove={() => {
                setAvatarUrl("")
                updateProfileMutation.mutate({ avatarUrl: "" })
              }}
            />
            
            <div className="flex flex-col items-center mt-3 text-center">
              <span className="text-base font-bold text-foreground tracking-tight">{user?.name}</span>
              <span className="text-2xs font-medium text-muted-foreground mt-0.5">{user?.email}</span>
              <Badge variant="info" className="mt-2.5 px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                Auditor Tier
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 w-full mt-5 pt-5 border-t border-border text-xs">
            <div className="bg-muted/50 border border-border rounded-[10px] p-3 flex flex-col gap-0.5 select-none">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Activity className="size-3" />
                Auth Status
              </span>
              <span className="font-bold text-success text-[11px] flex items-center gap-1 mt-0.5">
                <span className="size-1.5 rounded-full bg-success inline-block animate-pulse" />
                Active
              </span>
            </div>
            <div className="bg-muted/50 border border-border rounded-[10px] p-3 flex flex-col gap-0.5 select-none">
              <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Calendar className="size-3" />
                Registered
              </span>
              <span className="font-bold text-foreground text-[11px] mt-0.5">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jul 2026"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Forms */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Personal Information */}
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-5 text-card-foreground">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
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
                disabled={true}
                placeholder="john.doe@example.com"
                type="email"
                helperText="Email address is linked to authentication credentials and cannot be modified."
              />
            </div>

            <div className="flex justify-end border-t border-border pt-4 mt-1">
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
          <div className="bg-card border border-border rounded-[16px] p-6 shadow-card flex flex-col gap-5 text-card-foreground">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2.5 flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              Security & Credentials
            </h3>

            <div className="flex flex-col divide-y divide-border text-xs">
              <div className="flex items-center justify-between py-3.5 first:pt-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground">Account Password</span>
                  <span className="text-muted-foreground">Regularly update credentials to protect transaction ledger logs.</span>
                </div>
                <CustomButton variant="outline" size="sm" className="border-gray-200 shrink-0" onClick={() => setIsPasswordOpen(true)}>
                  Change Password
                </CustomButton>
              </div>

              <div className="flex items-center justify-between py-3.5 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">Two-Factor Authentication (2FA)</span>
                    <Badge variant="default" className="text-[9px] font-bold px-1.5 py-0.2 bg-muted text-muted-foreground border-border">Roadmap</Badge>
                  </div>
                  <span className="text-muted-foreground">Secure authorization checks using phone codes or authenticator apps.</span>
                </div>
                <CustomButton variant="outline" size="sm" className="border-gray-200 shrink-0 opacity-60 cursor-not-allowed" disabled>
                  Enable MFA
                </CustomButton>
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

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-12 animate-pulse font-sans">
      <div className="flex justify-between items-center border-b border-border pb-5">
        <div className="h-8 w-1/4 bg-gray-200 rounded-[6px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-2">
        <div className="bg-card border border-border rounded-[16px] h-80" />
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-card border border-border rounded-[16px] h-60" />
          <div className="bg-card border border-border rounded-[16px] h-40" />
        </div>
      </div>
    </div>
  )
}
