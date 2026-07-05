import React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCurrency } from "../../hooks/useCurrency"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  isSuccess?: boolean
  isRequired?: boolean
  helperText?: string
}

export const CustomInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, isSuccess, isRequired, helperText, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full text-foreground">
        {label && (
          <label className="text-sm font-medium text-foreground select-none">
            {label}
            {isRequired && <span className="text-danger ml-1 font-semibold">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            "w-full h-10 px-3.5 py-2 text-sm bg-background text-foreground border rounded-[10px] outline-none transition-colors",
            "placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-1 focus:ring-ring disabled:opacity-50",
            error
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : isSuccess
              ? "border-success focus:border-success focus:ring-success/20"
              : "border-border focus:border-primary focus:ring-primary/20",
            className
          )}
          {...props}
        />
        {helperText && <span className="text-xs text-muted-foreground leading-none mt-0.5">{helperText}</span>}
        {error && <span className="text-xs text-danger font-medium leading-none">{error}</span>}
      </div>
    )
  }
)

CustomInput.displayName = "CustomInput"

// Search Input Component (Section 27)
export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none select-none" />
        <input
          ref={ref}
          type="text"
          className={cn(
            "w-full h-10 pl-10 pr-10 py-2 text-sm bg-background text-foreground border border-border rounded-[10px] outline-none transition-colors",
            "placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-1 focus:ring-primary/20 focus:border-primary",
            className
          )}
          {...props}
        />
        {onClear && props.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-full text-muted-foreground hover:bg-muted transition-colors cursor-pointer outline-none"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"

// Currency Input Component (Section 20/43)
export interface CurrencyInputProps extends InputProps {
  currencySymbol?: string
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, label, currencySymbol, error, isSuccess, isRequired, ...props }, ref) => {
    const { symbol } = useCurrency()
    const activeSymbol = currencySymbol !== undefined ? currencySymbol : symbol

    return (
      <div className="flex flex-col gap-2 w-full text-foreground">
        {label && (
          <label className="text-sm font-medium text-foreground select-none">
            {label}
            {isRequired && <span className="text-danger ml-1 font-semibold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-muted-foreground select-none pointer-events-none">
            {activeSymbol}
          </span>
          <input
            ref={ref}
            type="number"
            step="0.01"
            className={cn(
              "w-full h-10 pl-8 pr-3 py-2 text-sm bg-background text-foreground border rounded-[10px] outline-none transition-colors",
              "placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-1 focus:ring-ring disabled:opacity-50",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : isSuccess
                ? "border-success focus:border-success focus:ring-success/20"
                : "border-border focus:border-primary focus:ring-primary/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger font-medium leading-none">{error}</span>}
      </div>
    )
  }
)

CurrencyInput.displayName = "CurrencyInput"
