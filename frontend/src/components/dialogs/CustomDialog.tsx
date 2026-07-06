import React, { useEffect } from "react"
import { AlertTriangle, X } from "lucide-react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import { CustomButton } from "../buttons/CustomButton"

export interface DialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg"
}

export const CustomDialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
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

  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[800px]",
  }

  // Render using portal to attach directly to body root
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-[#4E220F]/30 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Responsive Sheet / Modal container (Section 33) */}
      <div
        className={cn(
          "relative z-10 w-full bg-[#FBF8F2] border border-border flex flex-col focus:outline-none shadow-modal transition-all duration-200 text-card-foreground",
          // Mobile: bottom sheet, full width, rounded top
          "rounded-t-[16px] max-h-[85vh] sm:rounded-b-[16px]",
          // Desktop: centered, size constraints, custom border radius (16px)
          "sm:rounded-[16px] sm:max-h-[90vh] sm:w-full",
          sizeClasses[size]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border mb-3">
          <div className="flex flex-col gap-1.5 pr-4">
            <h3 id="dialog-title" className="text-[18px] font-bold text-foreground leading-snug">
              {title}
            </h3>
            {description && (
              <p className="text-[14px] font-normal text-muted-foreground leading-normal mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content (Scrollable if tall) */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-3 text-[15px] font-medium text-foreground leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border p-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-muted/20 rounded-b-[16px]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Confirmation Dialog Pattern (Section 42)
export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  isLoading = false,
}) => {
  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <CustomButton variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </CustomButton>
          <CustomButton
            variant={isDestructive ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </CustomButton>
        </>
      }
    >
      <div className="flex gap-3 py-2">
        {isDestructive && (
          <div className="size-10 rounded-full bg-danger/10 flex items-center justify-center text-danger shrink-0">
            <AlertTriangle className="size-5" />
          </div>
        )}
        <p className="text-sm text-muted-foreground leading-normal">{message}</p>
      </div>
    </CustomDialog>
  )
}
