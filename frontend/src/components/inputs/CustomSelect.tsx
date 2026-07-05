import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  isRequired?: boolean
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select option",
  className,
  disabled = false,
  label,
  isRequired = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (val: string) => {
    if (disabled) return
    onChange(val)
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col gap-2 w-full text-foreground relative" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-foreground select-none flex items-center">
          {label}
          {isRequired && <span className="text-danger ml-1 font-semibold">*</span>}
        </label>
      )}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 py-2 text-sm bg-background text-foreground border border-border rounded-[10px] outline-none flex items-center justify-between transition-all duration-150 cursor-pointer select-none",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && <span className="shrink-0 text-muted-foreground">{selectedOption.icon}</span>}
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-2",
            isOpen && "transform rotate-180 text-primary"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-popover/95 backdrop-blur-md border border-border rounded-[12px] shadow-dropdown z-50 p-1.5 font-sans text-xs animate-dropdown origin-top max-h-[220px] overflow-y-auto">
          {options.length === 0 ? (
            <div className="py-3 text-center text-muted-foreground">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-left rounded-[8px] transition-all duration-150 select-none cursor-pointer group font-medium",
                    isSelected
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-popover-foreground/80 hover:bg-muted hover:text-popover-foreground"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {opt.icon && (
                      <span className={cn(
                        "shrink-0 transition-colors duration-150",
                        isSelected ? "text-primary" : "text-muted-foreground group-hover:text-popover-foreground"
                      )}>
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
