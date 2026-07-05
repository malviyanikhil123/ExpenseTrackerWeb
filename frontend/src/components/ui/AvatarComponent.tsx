import React, { useRef, useState } from "react"
import { Camera, Trash2, User } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AvatarProps {
  src?: string
  initials?: string
  size?: "sm" | "md" | "lg" | "xl"
  onUpload?: (file: File) => void
  onRemove?: () => void
  editable?: boolean
  className?: string
}

export const AvatarComponent: React.FC<AvatarProps> = ({
  src,
  initials = "",
  size = "md",
  onUpload,
  onRemove,
  editable = false,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localSrc, setLocalSrc] = useState<string | undefined>(src)

  const sizes = {
    sm: "size-10 text-xs",
    md: "size-16 text-sm",
    lg: "size-24 text-lg",
    xl: "size-32 text-2xl",
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalSrc(reader.result as string)
      }
      reader.readAsDataURL(file)
      if (onUpload) onUpload(file)
    }
  }

  const handleBrowse = () => {
    if (editable) fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLocalSrc(undefined)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (onRemove) onRemove()
  }

  // Get initials: up to 2 letters, uppercase
  const getInitials = (val: string) => {
    if (!val) return ""
    return val
      .split(" ")
      .map((part) => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
  }

  return (
    <div className={cn("relative flex items-center gap-4", className)}>
      <div
        onClick={handleBrowse}
        className={cn(
          "relative rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center font-semibold text-gray-600 shrink-0",
          sizes[size],
          editable && "cursor-pointer group hover:opacity-90"
        )}
      >
        {localSrc ? (
          <img src={localSrc} alt="Avatar" className="size-full object-cover" />
        ) : initials ? (
          <span>{getInitials(initials)}</span>
        ) : (
          <User className="size-1/2 text-gray-400" />
        )}

        {editable && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Camera className="size-6 text-white" />
          </div>
        )}
      </div>

      {editable && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">Profile Picture</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBrowse}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Upload Photo
            </button>
            {localSrc && (
              <>
                <span className="text-gray-300 text-xs">|</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs font-semibold text-danger hover:underline flex items-center gap-1"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              </>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  )
}
