import React from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700 select-none">
            {label}
            {isRequired && <span className="text-danger ml-1 font-semibold">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 px-3 py-2 text-sm bg-white border rounded-[10px] outline-none transition-colors",
              "placeholder:text-gray-400 focus:ring-2 focus:ring-offset-1 focus:ring-ring disabled:opacity-50",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : isSuccess
                ? "border-success focus:border-success focus:ring-success/20"
                : "border-gray-200 focus:border-primary focus:ring-primary/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger font-medium leading-none">{error}</span>}
        {!error && helperText && <span className="text-xs text-gray-400 leading-none">{helperText}</span>}
      </div>
    )
  }
)

CustomInput.displayName = "CustomInput"

// Search Input Component (Section 27)
export interface SearchInputProps extends Omit<InputProps, "label" | "isRequired"> {
  onClear?: () => void
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, onChange, ...props }, ref) => {
    const hasValue = Boolean(value)

    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 size-4 text-gray-400 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          className={cn(
            "w-full h-10 pl-9 pr-8 text-sm bg-white border border-gray-200 rounded-[10px] outline-none transition-colors",
            "placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-offset-1 focus:ring-primary/20",
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
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
  ({ className, label, currencySymbol = "$", error, isSuccess, isRequired, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2 w-full">
        {label && (
          <label className="text-sm font-medium text-gray-700 select-none">
            {label}
            {isRequired && <span className="text-danger ml-1 font-semibold">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <span className="absolute left-3 text-sm font-medium text-gray-400 select-none pointer-events-none">
            {currencySymbol}
          </span>
          <input
            ref={ref}
            type="number"
            step="0.01"
            className={cn(
              "w-full h-10 pl-8 pr-3 py-2 text-sm bg-white border rounded-[10px] outline-none transition-colors",
              "placeholder:text-gray-400 focus:ring-2 focus:ring-offset-1 focus:ring-ring disabled:opacity-50",
              error
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : isSuccess
                ? "border-success focus:border-success focus:ring-success/20"
                : "border-gray-200 focus:border-primary focus:ring-primary/20",
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
