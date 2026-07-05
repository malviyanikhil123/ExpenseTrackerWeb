import React, { useState, useRef, useEffect } from "react"

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
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {React.cloneElement(trigger as React.ReactElement<any>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        },
      })}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[190px] bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-[12px] shadow-dropdown z-50 p-1.5 font-sans text-xs animate-dropdown origin-top-right">
          {items.map((item, idx) => {
            const isPreviousItemNormal = idx > 0 && !items[idx - 1].isDestructive
            const shouldShowDivider = item.isDestructive && isPreviousItemNormal

            return (
              <React.Fragment key={idx}>
                {shouldShowDivider && <div className="h-px bg-gray-100 my-1 mx-1" />}
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
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
                  }`}
                >
                  {item.icon && (
                    <span className={`transition-colors duration-150 shrink-0 ${
                      item.isDestructive 
                        ? "text-danger/70 group-hover:text-danger" 
                        : "text-gray-400 group-hover:text-gray-700"
                    }`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="truncate">{item.label}</span>
                </button>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </div>
  )
}
