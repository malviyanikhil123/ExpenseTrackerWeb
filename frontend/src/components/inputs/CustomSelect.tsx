import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
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
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Update coords when opening dropdown
  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      
      // Calculate best fit (above or below trigger)
      const spaceBelow = window.innerHeight - rect.bottom
      const dropdownHeight = Math.min(250, options.length * 40 + (isSearchable ? 48 : 0) + 16)
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight

      setCoords({
        top: showAbove 
          ? rect.top + window.scrollY - dropdownHeight - 4 
          : rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Update position on scroll/resize
  useEffect(() => {
    if (isOpen) {
      updateCoords()
      window.addEventListener("scroll", updateCoords, true)
      window.addEventListener("resize", updateCoords)
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true)
      window.removeEventListener("resize", updateCoords)
    }
  }, [isOpen, options.length])

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

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    updateCoords()
    setIsOpen(!isOpen)
  }

  return (
    <div className="flex flex-col gap-2 w-full text-foreground" ref={containerRef}>
      {label && (
        <label className="text-[14px] font-semibold text-foreground select-none flex items-center">
          {label}
          {isRequired && <span className="text-danger ml-1 font-bold text-sm">*</span>}
        </label>
      )}
      
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleTriggerClick}
        className={cn(
          "w-full h-10 px-3.5 py-2 text-[14px] font-medium bg-card text-foreground border border-border hover:border-slate-500 rounded-[12px] outline-none flex items-center justify-between transition-all duration-200 cursor-pointer select-none",
          isOpen && "border-primary ring-2 ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {selectedOption?.icon && <span className="shrink-0 text-muted-foreground flex items-center">{selectedOption.icon}</span>}
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

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            maxHeight: "250px",
          }}
          className="bg-card border border-border rounded-[12px] shadow-2xl z-[300] p-1.5 font-sans text-xs animate-dropdown origin-top flex flex-col gap-1 overflow-hidden"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isSearchable && (
            <div className="px-2 py-1.5 border-b border-border bg-card z-10 flex items-center relative shrink-0">
              <Search className="absolute left-4 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 w-full pl-7.5 pr-7 bg-muted text-foreground border border-border rounded-[8px] text-[13px] outline-none focus:border-primary transition-colors font-sans"
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

          <div className="flex-1 overflow-y-auto max-h-[190px] custom-scrollbar flex flex-col gap-0.5 pr-0.5">
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
                      "w-full flex items-center justify-between gap-2.5 px-3 py-2 text-left rounded-[8px] transition-all duration-150 select-none cursor-pointer group font-medium",
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && (
                        <span className={cn(
                          "shrink-0 transition-colors duration-150 flex items-center",
                          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
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
        </div>,
        document.body
      )}
    </div>
  )
}
