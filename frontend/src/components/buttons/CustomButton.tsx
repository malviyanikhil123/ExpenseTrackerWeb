import React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "icon"
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
    // Adds Scale 1.02 on hover per guidelines.
    const baseStyles =
      "inline-flex shrink-0 items-center justify-center font-semibold text-[15px] tracking-[0.01em] whitespace-nowrap select-none transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] active:translate-y-px"

    // Variant mapping
    const variants = {
      primary: "bg-primary text-white hover:bg-[#8B592F] border border-transparent shadow-sm",
      secondary: "bg-background border border-secondary text-foreground hover:bg-background-secondary",
      outline: "bg-card border border-border text-foreground hover:bg-[#F2EBDE]",
      ghost: "bg-transparent text-foreground hover:bg-background border border-transparent",
      danger: "bg-danger-bg text-danger hover:bg-danger-bg/85 border border-transparent shadow-sm",
      success: "bg-[#53724D] text-white hover:opacity-90 border border-transparent shadow-sm",
      icon: "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-background rounded-md p-0",
    }

    // Border radii mapping: Buttons use 12px (rounded-[12px]) by default
    const radii = variant === "icon" ? "rounded-md" : "rounded-[12px]"

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
