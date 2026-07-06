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

  React.useEffect(() => {
    setLocalSrc(src)
  }, [src])

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
    <div className={cn(
      "relative flex gap-4",
      editable ? "flex-col items-center text-center w-full" : "items-center",
      className
    )}>
      <div
        onClick={handleBrowse}
        className={cn(
          "relative rounded-full overflow-hidden border border-border flex items-center justify-center font-semibold shrink-0 transition-all",
          sizes[size],
          localSrc
            ? "bg-card"
            : "bg-secondary text-foreground", // Sage green circle
          editable ? "cursor-pointer group hover:opacity-90 shadow-md p-1 border-2 border-border" : ""
        )}
      >
        {localSrc ? (
          <img src={localSrc} alt="Avatar" className="size-full object-cover rounded-full" />
        ) : initials ? (
          <span className="select-none font-bold text-sm tracking-wide">{getInitials(initials)}</span>
        ) : (
          <User className="size-1/2 text-foreground/75" />
        )}

        {editable && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
            <Camera className="size-6 text-white" />
          </div>
        )}
      </div>

      {editable && (
        <div className="flex flex-col gap-1 items-center justify-center">
          <span className="text-sm font-semibold text-foreground tracking-tight">Profile Picture</span>
          <div className="flex items-center gap-2 justify-center mt-0.5">
            <button
              type="button"
              onClick={handleBrowse}
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              Upload Photo
            </button>
            {localSrc && (
              <>
                <span className="text-border text-xs">|</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs font-semibold text-danger hover:underline flex items-center gap-1 cursor-pointer"
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
