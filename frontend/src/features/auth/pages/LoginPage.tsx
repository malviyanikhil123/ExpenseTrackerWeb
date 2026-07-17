import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { useAuthStore } from "../../../store/authStore"
import { api } from "../../../lib/api"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomButton } from "../../../components/buttons/CustomButton"

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
})

type LoginFormInputs = z.infer<typeof loginSchema>

function encryptPassword(password: string): string {
  const key = 0x5F
  return Array.from(password)
    .map((c) => (c.charCodeAt(0) ^ key).toString(16).padStart(2, "0"))
    .join("")
}

function decryptPassword(hex: string): string {
  try {
    const key = 0x5F
    const chars: string[] = []
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16) ^ key
      if (isNaN(code)) return ""
      chars.push(String.fromCharCode(code))
    }
    return chars.join("")
  } catch {
    return ""
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const queryClient = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  // Load saved credentials on mount (Section 26/remember me)
  useState(() => {
    const savedEmail = localStorage.getItem("remembered_email")
    const savedHash = localStorage.getItem("remembered_password_hash")
    if (savedEmail && savedHash) {
      const decrypted = decryptPassword(savedHash)
      if (decrypted) {
        setTimeout(() => {
          setValue("email", savedEmail)
          setValue("password", decrypted)
          setRememberMe(true)
        }, 0)
      }
    }
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", data)
      const { user, accessToken, refreshToken } = response.data

      setAuth(user, accessToken, refreshToken)

      // Persist password hash if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem("remembered_email", data.email)
        const passwordHash = encryptPassword(data.password)
        localStorage.setItem("remembered_password_hash", passwordHash)
        localStorage.removeItem("remembered_password") // Remove plain text password if legacy exists
      } else {
        localStorage.removeItem("remembered_email")
        localStorage.removeItem("remembered_password")
        localStorage.removeItem("remembered_password_hash")
      }

      // Invalidate caches per the Cache Invalidation Matrix
      queryClient.invalidateQueries({ queryKey: ["profile"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["accounts"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })

      toast.success(`Welcome back, ${user.name}!`)
      navigate("/dashboard")
    } catch (error: any) {
      const message = error.response?.data?.message || "Invalid email or password"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-card border border-border rounded-[16px] p-8 shadow-card flex flex-col gap-6 text-card-foreground">

        <div className="flex flex-col gap-1.5 text-center sm:text-left select-none">
          <div className="size-10 rounded-[10px] bg-primary flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm mx-auto sm:mx-0">
            ET
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-none">Welcome Back</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1 leading-normal">
            Enter your credentials below to access your account dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <CustomInput
            label="Email Address"
            type="email"
            isRequired={true}
            placeholder="name@example.com"
            disabled={isLoading}
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="relative">
            <CustomInput
              label="Password"
              type={showPassword ? "text" : "password"}
              isRequired={true}
              placeholder="••••••••"
              disabled={isLoading}
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[39px] p-0.5 text-muted-foreground hover:text-muted-foreground rounded-full transition-colors outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between select-none -mt-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border focus:ring-primary size-4"
              />
              Remember Me
            </label>
          </div>

          <CustomButton variant="primary" type="submit" className="w-full mt-1" isLoading={isLoading}>
            Login
          </CustomButton>
        </form>

        <div className="border-t border-border pt-5 text-center flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
