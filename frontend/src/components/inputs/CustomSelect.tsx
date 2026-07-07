import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Check, Search, X } from "lucide-react"
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
  isSearchable?: boolean
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
  isSearchable = false,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
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

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
    }
  }, [isOpen])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (val: string) => {
    if (disabled) return
    onChange(val)
    setIsOpen(false)
  }

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2 w-full text-foreground relative" ref={containerRef}>
      {label && (
        <label className="text-[14px] font-semibold text-foreground select-none flex items-center">
          {label}
          {isRequired && <span className="text-danger ml-1 font-bold text-sm">*</span>}
        </label>
      )}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 py-2 text-[15px] font-medium bg-input text-foreground border border-border hover:border-[#D8C8B3] rounded-[12px] outline-none flex items-center justify-between transition-all duration-200 cursor-pointer select-none",
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
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] bg-[#FAF7F1] border border-border rounded-[12px] shadow-dropdown z-50 p-1.5 font-sans text-xs animate-dropdown origin-top max-h-[260px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
          {isSearchable && (
            <div className="px-2 py-1.5 border-b border-border sticky top-0 bg-[#FAF7F1] z-10 flex items-center relative shrink-0">
              <Search className="absolute left-4 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full pl-7.5 pr-7 bg-input text-foreground border border-border rounded-[8px] text-[13px] outline-none focus:border-primary transition-colors font-sans"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[160px] custom-scrollbar flex flex-col gap-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 text-center text-muted-foreground font-medium">No options found</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-left rounded-[8px] transition-all duration-150 select-none cursor-pointer group font-medium",
                      isSelected
                        ? "bg-[#EAE3D4] text-foreground font-semibold"
                        : "text-[#4E220F]/80 hover:bg-[#F2EBDE] hover:text-[#4E220F]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && (
                        <span className={cn(
                          "shrink-0 transition-colors duration-150",
                          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-[#4E220F]"
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
        </div>
      )}
    </div>
  )
}
