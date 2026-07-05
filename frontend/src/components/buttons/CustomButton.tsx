import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "icon"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
  iconOnly?: boolean
}

export const CustomButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Base styles: Focus visible ring, active state transform translation, transition durations.
    const baseStyles =
      "inline-flex shrink-0 items-center justify-center font-normal whitespace-nowrap select-none transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px"

    // Variant mapping
    const variants = {
      primary: "bg-primary text-white hover:bg-[#5f5666] border border-transparent shadow-sm",
      secondary: "bg-transparent border border-primary text-primary hover:bg-primary/5",
      outline: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent",
      danger: "bg-danger text-white hover:opacity-90 border border-transparent shadow-sm",
      icon: "bg-transparent border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md p-0",
    }

    // Border radii mapping (Section 6: Small 6px, Medium 10px, Large 16px, Pill 999px)
    // Buttons use Medium (10px) by default
    const radii = variant === "icon" ? "rounded-md" : "rounded-[10px]"

    // Size mapping
    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
      icon: "size-10",
    }

    const currentSize = variant === "icon" ? sizes.icon : sizes[size]

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          radii,
          currentSize,
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="size-4 animate-spin text-current" />
        )}
        {children}
      </button>
    )
  }
)

CustomButton.displayName = "CustomButton"
