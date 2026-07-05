import React from "react"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  Coins,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  id: string
  title: string
  icon: React.ReactNode
  badge?: string | number
}

export interface SidebarProps {
  activeId: string
  onItemSelect: (id: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onLogout?: () => void
  className?: string
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeId,
  onItemSelect,
  isCollapsed = false,
  onToggleCollapse,
  onLogout,
  className,
}) => {
  const items: SidebarItem[] = [
    { id: "dashboard", title: "Dashboard", icon: <LayoutDashboard className="size-5" /> },
    { id: "transactions", title: "Transactions", icon: <Receipt className="size-5" /> },
    { id: "accounts", title: "Accounts", icon: <Wallet className="size-5" /> },
    { id: "categories", title: "Categories", icon: <Tags className="size-5" /> },
    { id: "debts", title: "Debts", icon: <Coins className="size-5" /> },
    { id: "analytics", title: "Analytics", icon: <BarChart3 className="size-5" /> },
    { id: "profile", title: "Profile", icon: <User className="size-5" /> },
  ]

  const handleItemClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    onItemSelect(id)
  }

  return (
    <aside
      className={cn(
        "h-screen flex flex-col justify-between border-r border-gray-200 bg-gray-50 transition-all duration-350 z-20 shrink-0",
        isCollapsed ? "w-20" : "full",
        className
      )}
    >
      {/* Sidebar Top: Branding & Collapse Button */}
      <div className="flex flex-col">
        <div className="h-[72px] border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-white">
          {!isCollapsed && (
            <span className="text-base font-bold tracking-tight text-gray-900 select-none">
              Expense Tracker
            </span>
          )}
          {isCollapsed && (
            <span className="text-base font-bold text-primary select-none mx-auto">ET</span>
          )}

          {/* Desktop Collapse Trigger */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:flex p-1 rounded-md border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items (Section 22) */}
        <nav className="flex flex-col gap-1.5 p-4 overflow-y-auto">
          {items.map((item) => {
            const isActive = activeId === item.id

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(item.id, e)}
                className={cn(
                  "relative flex items-center gap-3 px-3.5 py-3 text-sm font-normal rounded-[10px] select-none transition-colors group/nav",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-primary/10 hover:text-primary"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span className={cn(isActive ? "text-white" : "text-gray-400 group-hover/nav:text-primary")}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="font-normal">{item.title}</span>}

                {/* Badge indicator */}
                {item.badge && !isCollapsed && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Collapsed (Section 22) */}
                {isCollapsed && (
                  <div className="absolute left-20 ml-2 hidden group-hover/nav:block bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-[6px] shadow-md whitespace-nowrap z-30 font-medium">
                    {item.title}
                  </div>
                )}
              </a>
            )
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Logout Action (Section 22) */}
      <div className="p-4 border-t border-gray-200/60 bg-gray-50/50">
        <button
          type="button"
          onClick={onLogout}
          className={cn(
            "relative w-full flex items-center gap-3 px-3.5 py-3 text-sm font-normal text-danger hover:bg-danger/5 rounded-[10px] select-none transition-colors group/logout"
          )}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="size-5 shrink-0 text-danger" />
          {!isCollapsed && <span className="font-normal">Logout</span>}

          {/* Tooltip on Collapsed */}
          {isCollapsed && (
            <div className="absolute left-20 ml-2 hidden group-hover/logout:block bg-danger text-white text-xs px-2.5 py-1.5 rounded-[6px] shadow-md whitespace-nowrap z-30 font-medium">
              Logout
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}
