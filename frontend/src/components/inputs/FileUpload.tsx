import React, { useRef, useState } from "react"
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomButton } from "../buttons/CustomButton"

export interface FileUploadProps {
  onFileSelect?: (file: File | null) => void
  accept?: string
  maxSizeMB?: number
  label?: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = "image/*,application/pdf",
  maxSizeMB = 5,
  label = "Upload File",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setError(null)
    const sizeInMB = file.size / (1024 * 1024)

    if (sizeInMB > maxSizeMB) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }

    setSelectedFile(file)
    if (onFileSelect) onFileSelect(file)

    // Generate preview URL if it's an image
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleBrowse = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (onFileSelect) onFileSelect(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <span className="text-sm font-medium text-gray-700 select-none">{label}</span>}

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleBrowse}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-[10px] p-6 bg-white cursor-pointer transition-all hover:bg-gray-50",
            isDragOver && "border-primary bg-primary/5",
            error && "border-danger bg-danger/5"
          )}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
          <Upload className={cn("size-8 text-gray-400 mb-3", isDragOver && "text-primary")} />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Drag & Drop or <span className="text-primary hover:underline">Browse</span>
          </p>
          <p className="text-xs text-gray-400">Supports images & PDFs up to {maxSizeMB}MB</p>
          {error && <span className="text-xs text-danger font-medium mt-2">{error}</span>}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-[10px] p-4 bg-white flex items-center justify-between shadow-card">
          <div className="flex items-center gap-3">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="File preview"
                className="size-12 rounded-md object-cover border border-gray-100"
              />
            ) : selectedFile.type.includes("pdf") ? (
              <div className="size-12 rounded-md bg-danger/5 border border-danger/10 flex items-center justify-center text-danger">
                <FileText className="size-6" />
              </div>
            ) : (
              <div className="size-12 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                <ImageIcon className="size-6" />
              </div>
            )}
            <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
              <span className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <CustomButton variant="outline" size="sm" onClick={handleBrowse}>
              Replace
            </CustomButton>
            <CustomButton variant="icon" className="text-danger hover:bg-danger/5 border-transparent size-8" onClick={handleRemove}>
              <X className="size-4" />
            </CustomButton>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  )
}
