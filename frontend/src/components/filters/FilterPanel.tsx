import React, { useState } from "react"
import { Filter, SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CustomButton } from "../buttons/CustomButton"
import { CustomDrawer } from "../drawers/CustomDrawer"

// Active Filter Chip Type
export interface FilterChipType {
  id: string
  label: string
}

// Filter Panel Props
export interface FilterPanelProps {
  activeFilters: FilterChipType[]
  onRemoveFilter: (id: string) => void
  onApplyFilters: (filters: Record<string, any>) => void
  onResetFilters: () => void
  children?: React.ReactNode
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  activeFilters,
  onRemoveFilter,
  onApplyFilters,
  onResetFilters,
  children,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleApply = () => {
    // For demonstration, trigger apply
    onApplyFilters({})
    setIsDrawerOpen(false)
    setIsDropdownOpen(false)
  }

  const handleReset = () => {
    onResetFilters()
    setIsDrawerOpen(false)
    setIsDropdownOpen(false)
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Search / Controls Toolbar Row */}
      <div className="flex items-center gap-2">
        {/* Desktop Filter Panel Popover Toggle */}
        <div className="relative hidden md:block">
          <CustomButton
            variant="outline"
            size="md"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="gap-2"
          >
            <Filter className="size-4" />
            Filters
          </CustomButton>

          {isDropdownOpen && (
            <>
              {/* Overlay click-away trigger */}
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
              
              {/* Dropdown panel (Section 28) */}
              <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-[16px] shadow-dropdown p-5 z-20 flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-2">
                  Filters
                </h4>
                <div className="flex flex-col gap-3">{children}</div>
                <div className="border-t border-gray-100 pt-3 flex justify-between gap-3">
                  <CustomButton variant="ghost" size="sm" onClick={handleReset} className="text-xs">
                    Reset
                  </CustomButton>
                  <CustomButton variant="primary" size="sm" onClick={handleApply} className="text-xs">
                    Apply
                  </CustomButton>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tablet & Mobile Filter Button (Triggers Drawer) */}
        <div className="block md:hidden">
          <CustomButton
            variant="outline"
            size="md"
            onClick={() => setIsDrawerOpen(true)}
            className="gap-2"
          >
            <Filter className="size-4" />
            Filters
          </CustomButton>

          <CustomDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            title="Filter Results"
            description="Refine transactions list using attributes below"
            footer={
              <div className="w-full flex justify-between gap-4">
                <CustomButton variant="outline" className="flex-1" onClick={handleReset}>
                  Reset
                </CustomButton>
                <CustomButton variant="primary" className="flex-1" onClick={handleApply}>
                  Apply
                </CustomButton>
              </div>
            }
          >
            <div className="flex flex-col gap-5 py-2">{children}</div>
          </CustomDrawer>
        </div>
      </div>

      {/* Filter Chips List (Section 28) */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
            Active Filters:
          </span>
          {activeFilters.map((chip) => (
            <div
              key={chip.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 pl-2.5 pr-1.5 py-1 rounded-pill text-xs font-medium"
            >
              <span>{chip.label}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter(chip.id)}
                className="p-0.5 rounded-full hover:bg-primary/20 text-primary transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Sorting Component (Section 29)
export interface SortDropdownProps {
  value: string
  onChange: (sort: string) => void
}

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <SlidersHorizontal className="size-4 text-gray-400 hidden sm:block" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-[10px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-offset-1 focus:ring-primary/20"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="highest_amount">Highest Amount</option>
        <option value="lowest_amount">Lowest Amount</option>
        <option value="alphabetical">Alphabetical</option>
      </select>
    </div>
  )
}
