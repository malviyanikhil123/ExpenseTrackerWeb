import React, { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"

export interface DropdownMenuItem {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  isDestructive?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactElement
  items: DropdownMenuItem[]
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownWidth = 190
      const margin = 8

      // Try to align to the right edge of the trigger first
      let left = rect.right - dropdownWidth + window.scrollX

      // If that goes off the left edge of the viewport, align to the left edge of the trigger
      if (left < window.scrollX + margin) {
        left = rect.left + window.scrollX
      }

      // Constrain within viewport boundaries (with a safety margin)
      const minLeft = window.scrollX + margin
      const maxLeft = window.innerWidth + window.scrollX - dropdownWidth - margin
      left = Math.max(minLeft, Math.min(maxLeft, left))

      setCoords({
        top: rect.bottom + window.scrollY,
        left,
      })
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
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
  }, [isOpen])

  // Clone trigger element to attach ref and click listener
  const triggerElement = React.cloneElement(trigger, {
    ref: triggerRef,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      updateCoords()
      setIsOpen(!isOpen)
    },
  } as any)

  return (
    <div className="relative inline-block text-left">
      {triggerElement}

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: `${coords.top + 4}px`,
            left: `${coords.left}px`,
            width: "190px",
          }}
          className="bg-popover/95 backdrop-blur-md border border-border rounded-[12px] shadow-dropdown z-[300] p-1.5 font-sans text-xs animate-dropdown origin-top-right text-popover-foreground"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {items.map((item, idx) => {
            const isPreviousItemNormal = idx > 0 && !items[idx - 1].isDestructive
            const shouldShowDivider = item.isDestructive && isPreviousItemNormal

            return (
              <React.Fragment key={idx}>
                {shouldShowDivider && <div className="h-px bg-border my-1 mx-1" />}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                    item.onClick()
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-[8px] transition-all duration-150 select-none cursor-pointer group ${
                    item.isDestructive
                      ? "text-danger hover:bg-danger/8 hover:text-danger font-medium"
                      : "text-popover-foreground/80 hover:bg-muted hover:text-popover-foreground font-medium"
                  }`}
                >
                  {item.icon && (
                    <span className={`transition-colors duration-150 shrink-0 ${
                      item.isDestructive 
                        ? "text-danger/70 group-hover:text-danger" 
                        : "text-muted-foreground group-hover:text-popover-foreground"
                    }`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>,
        document.body
      )}
    </div>
  )
}
