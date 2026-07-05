import React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomButton } from "../buttons/CustomButton"

export interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  totalItems: number
}

export const CustomPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalItems,
}) => {
  const rangeStart = (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  const getPages = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 border-t border-gray-100 pt-4">
      {/* Page Size & Stats (Left) */}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 pl-2 pr-6 py-1 bg-white border border-gray-200 rounded-[6px] text-xs outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        )}
        <span>
          Showing <span className="font-semibold text-gray-800">{rangeStart}</span> to{" "}
          <span className="font-semibold text-gray-800">{rangeEnd}</span> of{" "}
          <span className="font-semibold text-gray-800">{totalItems}</span> entries
        </span>
      </div>

      {/* Pagination Controls (Right on Desktop, Load More on Mobile) */}
      <div className="w-full sm:w-auto">
        {/* Mobile View: Load More button */}
        <div className="block sm:hidden w-full">
          {currentPage < totalPages && (
            <CustomButton
              variant="outline"
              className="w-full h-10 font-semibold"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Load More
            </CustomButton>
          )}
        </div>

        {/* Desktop View: Number sequence */}
        <div className="hidden sm:flex items-center gap-1">
          <CustomButton
            variant="icon"
            className="size-8"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <ChevronLeft className="size-4" />
          </CustomButton>

          {getPages().map((page) => {
            const isCurrent = page === currentPage
            return (
              <CustomButton
                key={page}
                variant={isCurrent ? "primary" : "outline"}
                className={cn(
                  "size-8 text-xs p-0 font-medium",
                  isCurrent ? "shadow-none pointer-events-none" : "border-gray-200 text-gray-700"
                )}
                onClick={() => onPageChange(page)}
              >
                {page}
              </CustomButton>
            )
          })}

          <CustomButton
            variant="icon"
            className="size-8"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <ChevronRight className="size-4" />
          </CustomButton>
        </div>
      </div>
    </div>
  )
}
