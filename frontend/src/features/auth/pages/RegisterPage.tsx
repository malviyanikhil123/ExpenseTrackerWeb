import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import { api } from "../../../lib/api"
import { CustomInput } from "../../../components/inputs/CustomInput"
import { CustomButton } from "../../../components/buttons/CustomButton"

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type RegisterFormInputs = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordValue, setPasswordValue] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  })

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", score: 0, color: "bg-muted" }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[a-z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 2) return { label: "Weak", score, color: "bg-danger" }
    if (score <= 4) return { label: "Medium", score, color: "bg-warning" }
    return { label: "Strong", score, color: "bg-success" }
  }

  const strength = getPasswordStrength(passwordValue)

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true)
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      })

      toast.success("Account created successfully! Please login.")
      navigate("/login")
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Email might exist."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-[420px] bg-card border border-border rounded-[16px] p-8 shadow-card flex flex-col gap-6 text-card-foreground">

        <div className="flex flex-col gap-1.5 text-center sm:text-left select-none">
          <div className="text-[22px] font-bold text-primary tracking-tight mb-2">
            Spendra
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-foreground leading-none">Create Account</h1>
          <p className="text-[14px] font-normal text-muted-foreground mt-1 leading-normal">
            Track income, categorize purchases, and check debts.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <CustomInput
            label="Full Name"
            type="text"
            isRequired={true}
            placeholder="John Doe"
            disabled={isLoading}
            error={errors.name?.message}
            {...register("name")}
          />

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
              {...register("password", {
                onChange: (e) => setPasswordValue(e.target.value),
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[39px] p-0.5 text-muted-foreground hover:text-muted-foreground rounded-full transition-colors outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {passwordValue && (
            <div className="flex flex-col gap-1.5 -mt-2">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                <span>Password Strength</span>
                <span className={cn(
                  strength.label === "Weak" && "text-danger",
                  strength.label === "Medium" && "text-warning",
                  strength.label === "Strong" && "text-success"
                )}>{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color} transition-all duration-300`}
                  style={{ width: `${(strength.score / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <CustomInput
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            isRequired={true}
            placeholder="••••••••"
            disabled={isLoading}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <CustomButton variant="primary" type="submit" className="w-full mt-2" isLoading={isLoading}>
            Create Account
          </CustomButton>
        </form>

        <div className="border-t border-border pt-5 text-center flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Login
            </Link>
          </p>
        </div>

      </div>
    </div>
  )

  function cn(...classes: any[]) {
    return classes.filter(Boolean).join(" ")
  }
}
