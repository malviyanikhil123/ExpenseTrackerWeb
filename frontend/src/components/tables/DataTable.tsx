import React, { useState } from "react"
import { MoreVertical, Edit2, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableLoader, EmptyState } from "../feedback/FeedbackStates"

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  renderMobileCard: (row: T, actions: React.ReactNode) => React.ReactNode
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No data available",
  emptyDescription = "Get started by adding some records.",
  emptyActionLabel,
  onEmptyAction,
  onView,
  onEdit,
  onDelete,
  renderMobileCard,
}: DataTableProps<T>) {
  const [activeMenuRowId, setActiveMenuRowId] = useState<string | number | null>(null)

  const handleActionToggle = (rowId: string | number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeMenuRowId === rowId) {
      setActiveMenuRowId(null)
    } else {
      setActiveMenuRowId(rowId)
    }
  }

  // Close menus on click away
  React.useEffect(() => {
    const clickAway = () => {
      setActiveMenuRowId(null)
    }
    window.addEventListener("click", clickAway)
    return () => window.removeEventListener("click", clickAway)
  }, [])

  if (isLoading) {
    return (
      <div className="p-6">
        <TableLoader />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    )
  }

  // Row Action Dropdown Menu markup (Section 35)
  const renderActionsMenu = (row: T) => {
    const isMenuOpen = activeMenuRowId === row.id
    const hasActions = onView || onEdit || onDelete

    if (!hasActions) return null

    return (
      <div className="relative flex justify-end">
        <button
          type="button"
          onClick={(e) => handleActionToggle(row.id, e)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="size-4.5" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-8 w-40 bg-white border border-gray-200 rounded-[10px] shadow-dropdown py-1 z-30">
            {onView && (
              <button
                type="button"
                onClick={() => onView(row)}
                className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Eye className="size-4 text-gray-400" />
                View
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit2 className="size-4 text-gray-400" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(row)}
                className="w-full h-10 px-4 text-left text-sm text-danger hover:bg-danger/5 flex items-center gap-2 border-t border-gray-50"
              >
                <Trash2 className="size-4 text-danger" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Desktop Table View (Section 31) */}
      <div className="hidden md:block overflow-x-auto w-full border border-gray-100 rounded-[16px] bg-white shadow-card">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0"
                >
                  {col.header}
                </th>
              ))}
              {(onView || onEdit || onDelete) && (
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 text-right">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50/50 transition-colors group/row"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700 font-normal">
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
                {(onView || onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">
                    {renderActionsMenu(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Stack View (Section 31 & 32) */}
      <div className="flex flex-col gap-4 md:hidden">
        {data.map((row) => (
          <div
            key={row.id}
            className="bg-white border border-gray-100 rounded-[16px] p-6 shadow-card hover:shadow-md transition-shadow relative flex flex-col gap-2"
          >
            {/* Action menu positioned at the top-right of the card */}
            <div className="absolute top-4 right-4">
              {renderActionsMenu(row)}
            </div>
            
            {/* Render customizable mobile layout details */}
            {renderMobileCard(row, null)}
          </div>
        ))}
      </div>
    </div>
  )
}
