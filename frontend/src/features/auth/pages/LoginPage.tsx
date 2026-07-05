import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { useAuthStore } from "../../../store/authStore"
import { api } from "../../../lib/api"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomButton } from "../../../components/buttons/CustomButton"

const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
})

type LoginFormInputs = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true)
    try {
      const response = await api.post("/auth/login", data)
      const { user, accessToken, refreshToken } = response.data

      setAuth(user, accessToken, refreshToken)
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-white border border-gray-200 rounded-[16px] p-8 shadow-card flex flex-col gap-6">
        
        <div className="flex flex-col gap-1.5 text-center sm:text-left select-none">
          <div className="size-10 rounded-[10px] bg-primary flex items-center justify-center text-white font-bold text-lg mb-2 shadow-sm mx-auto sm:mx-0">
            ET
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-none">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1 leading-normal">
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
              className="absolute right-3.5 top-[39px] p-0.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <CustomButton variant="primary" type="submit" className="w-full mt-2" isLoading={isLoading}>
            Login
          </CustomButton>
        </form>

        <div className="border-t border-gray-100 pt-5 text-center flex flex-col gap-2">
          <p className="text-xs text-gray-500">
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
