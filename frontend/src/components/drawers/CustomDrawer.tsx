import React, { useEffect } from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
}

export const CustomDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}) => {
  // ESC key closing support (Section 47)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch justify-end p-0">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/30 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Drawer content frame (Section 34) */}
      <div
        className={cn(
          "relative z-10 w-full bg-[#FBF8F2] border-l border-border flex flex-col focus:outline-none shadow-modal transition-transform duration-250",
          // Mobile: bottom sheet, slide up, max 85vh
          "rounded-t-[16px] max-h-[85vh] md:rounded-t-none md:max-h-none",
          // Desktop: slide in from right, width: 480px, full height
          "md:w-[480px] md:h-screen"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex flex-col gap-1 pr-4">
            <h3 id="drawer-title" className="text-lg font-semibold text-foreground leading-none">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground leading-normal mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-foreground leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border p-6 bg-muted/30 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
