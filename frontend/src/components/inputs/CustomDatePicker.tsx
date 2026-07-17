import React, { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface DatePickerProps {
  label?: string
  value?: string // YYYY-MM-DD format
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  isRequired?: boolean
  align?: "left" | "right"
}

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = "Select date",
  error,
  isRequired,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Current calendar view (month and year)
  const [currentDate, setCurrentDate] = useState(() => {
    return value ? new Date(value) : new Date()
  })

  // Format date for display
  const getDisplayDate = () => {
    if (!value) return ""
    const d = new Date(value)
    if (isNaN(d.getTime())) return ""
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  }

  // Handle clicking outside to close popover
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return
      }
      if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
        return
      }
      setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Month navigation helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleSelectDay = (day: number) => {
    const selectedDate = new Date(year, month, day)
    const yyyy = selectedDate.getFullYear()
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const dd = String(selectedDate.getDate()).padStart(2, "0")
    onChange(`${yyyy}-${mm}-${dd}`)
    setIsOpen(false)
  }

  // Calendar calculation
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startDay = new Date(year, month, 1).getDay()

  // Generate calendar grid array
  const calendarCells: (number | null)[] = []
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(null)
  }
  for (let i = 1; i <= totalDays; i++) {
    calendarCells.push(i)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const sel = new Date(value)
    return sel.getDate() === day && sel.getMonth() === month && sel.getFullYear() === year
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2 w-full text-foreground select-none font-sans">
      {label && (
        <label className="text-[14px] font-semibold text-foreground select-none">
          {label}
          {isRequired && <span className="text-danger ml-1 font-bold text-sm">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative flex items-center justify-between w-full h-10 px-3.5 py-2 text-[15px] font-medium bg-input text-foreground border border-border rounded-[12px] outline-none transition-all duration-200 cursor-pointer hover:border-[#cbd5e1]",
          isOpen && "ring-2 ring-offset-1 ring-primary/20 border-primary",
          error && "border-danger ring-danger/20"
        )}
        onClick={() => setIsOpen(!isOpen)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className={cn("text-[15px] font-medium", !value && "text-muted-foreground")}>
          {getDisplayDate() || placeholder}
        </span>
        <div className="flex items-center gap-1.5">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
          <Calendar className="size-4 text-muted-foreground" />
        </div>
      </div>

      {error && <span className="text-xs text-danger font-semibold leading-none">{error}</span>}

      {/* Calendar Modal */}
      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-[#0b1c30]/30 backdrop-blur-[2px] transition-opacity duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div ref={calendarRef} className="relative z-10 w-[310px] bg-popover border border-border rounded-[16px] p-5 shadow-modal animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col gap-4 text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-[15px] font-bold text-foreground">
                {monthNames[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center text-2xs font-semibold text-muted-foreground tracking-wider uppercase">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />
                }
                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={cn(
                      "h-8 w-8 text-xs font-semibold rounded-full flex items-center justify-center transition-colors cursor-pointer outline-none mx-auto",
                      isToday(day) && "text-primary border border-primary/30",
                      isSelected(day)
                        ? "bg-primary text-primary-foreground hover:bg-primary"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Footer close button */}
            <div className="flex justify-end gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-[10px] text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
