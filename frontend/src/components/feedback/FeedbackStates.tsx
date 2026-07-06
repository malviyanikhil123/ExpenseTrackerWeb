import React from "react"
import { AlertCircle, FolderOpen, RefreshCw, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomButton } from "../buttons/CustomButton"

// Badge Component (Section 37)
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "sage" | "brown"
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const styles = {
    default: "bg-muted text-muted-foreground border-transparent",
    success: "bg-success-bg text-success border-success-border",
    warning: "bg-warning-bg text-warning border-transparent",
    danger: "bg-danger-bg text-danger border-transparent",
    info: "bg-info-bg text-info border-transparent",
    sage: "bg-success-bg text-success border-success-border",
    brown: "bg-[#F7F1DE] text-[#9D6638] border-border",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-[13px] font-bold select-none border transition-colors",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Skeleton Components (Section 39)
export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn("animate-pulse bg-muted rounded-[6px]", className)}
      {...props}
    />
  )
}

export const TableLoader: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex gap-4 border-b border-border pb-3">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-6 w-1/4" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 py-2 border-b border-border/40 items-center">
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-2/6" />
          <Skeleton className="h-5 w-1/6" />
          <Skeleton className="h-5 w-2/6" />
        </div>
      ))}
    </div>
  )
}

export const CardLoader: React.FC = () => {
  return (
    <div className="border border-border p-6 rounded-lg bg-card shadow-card flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="size-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-1/2" />
      <div className="flex gap-2 mt-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  )
}

export const ChartLoader: React.FC = () => {
  return (
    <div className="border border-border p-6 rounded-lg bg-card shadow-card flex flex-col gap-4 h-[300px]">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex-1 flex gap-2 items-end justify-between pt-8">
        <Skeleton className="h-[20%] w-12" />
        <Skeleton className="h-[45%] w-12" />
        <Skeleton className="h-[75%] w-12" />
        <Skeleton className="h-[30%] w-12" />
        <Skeleton className="h-[90%] w-12" />
        <Skeleton className="h-[60%] w-12" />
      </div>
    </div>
  )
}

export const PageLoader: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-2 w-1/3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardLoader />
        <CardLoader />
        <CardLoader />
      </div>
      <div className="border border-border p-6 rounded-lg bg-card shadow-card">
        <TableLoader />
      </div>
    </div>
  )
}

// Empty State Component (Section 40)
export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-[16px] bg-background-secondary">
      <div className="p-4 rounded-full bg-card border border-border shadow-sm text-muted-foreground mb-4">
        {icon || <FolderOpen className="size-8 text-secondary" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[320px] mb-6 leading-normal">{description}</p>
      {actionLabel && onAction && (
        <CustomButton variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </CustomButton>
      )}
    </div>
  )
}

export const SearchEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-card">
      <Search className="size-10 text-muted-foreground/50 mb-3" />
      <h3 className="text-base font-semibold text-foreground mb-1">No results found</h3>
      <p className="text-sm text-muted-foreground max-w-[280px]">Try changing your filters or search term.</p>
    </div>
  )
}

// Error Component (Section 41)
export interface ErrorStateProps {
  icon?: React.ReactNode
  title?: string
  message: string
  onRetry?: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  icon,
  title = "Something went wrong",
  message,
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-danger/15 rounded-[16px] bg-danger-bg">
      <div className="p-4 rounded-full bg-card border border-danger/25 shadow-sm text-danger mb-4">
        {icon || <AlertCircle className="size-8" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-danger max-w-[320px] mb-6 leading-normal font-medium">
        {message}
      </p>
      {onRetry && (
        <CustomButton variant="secondary" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-3.5" />
          Retry
        </CustomButton>
      )}
    </div>
  )
}
