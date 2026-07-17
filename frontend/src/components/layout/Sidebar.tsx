import React from "react"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Tags,
  Coins,
  BarChart3,
  User,
  Menu,
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
        "h-screen flex flex-col justify-between border-r border-sidebar-border bg-sidebar transition-all duration-350 z-20 shrink-0 select-none shadow-sm",
        isCollapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Sidebar Top: Branding & Collapse Button */}
      <div className="flex flex-col">
        <div className={cn(
          "flex items-center justify-between shrink-0 bg-sidebar px-6 border-b border-sidebar-border/30",
          isCollapsed ? "h-[72px]" : "h-24"
        )}>
          {!isCollapsed ? (
            <div className="flex flex-col select-none">
              <span className="text-[18px] font-bold text-primary tracking-tight leading-tight">
                Spendra
              </span>
              <span className="text-[12px] text-secondary opacity-70 font-semibold mt-0.5">
                Financial Wellness
              </span>
            </div>
          ) : (
            <span className="text-[18px] font-bold text-primary select-none mx-auto">S</span>
          )}

        </div>

        {/* Navigation Items (Section 22) */}
        <nav className="flex flex-col py-6 overflow-y-auto scrollbar-none gap-1">
          {items.map((item) => {
            const isActive = activeId === item.id

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => handleItemClick(item.id, e)}
                className={cn(
                  "relative flex items-center gap-3.5 px-6 py-3 text-[15px] select-none transition-all duration-150 active:scale-98 cursor-pointer",
                  isActive
                    ? "text-primary font-bold border-r-4 border-primary bg-primary/10"
                    : "text-secondary hover:bg-muted hover:text-foreground"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <span className={cn(
                  "transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-secondary group-hover/nav:text-foreground"
                )}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="font-medium font-body-md">{item.title}</span>}

                {/* Badge indicator */}
                {item.badge && !isCollapsed && (
                  <span
                    className={cn(
                      "ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold",
                      isActive ? "bg-primary/20 text-primary" : "bg-muted text-secondary"
                    )}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Tooltip on Collapsed (Section 22) */}
                {isCollapsed && (
                  <div className="absolute left-20 ml-2 hidden group-hover/nav:block bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded-[6px] shadow-md border border-border whitespace-nowrap z-30 font-medium">
                    {item.title}
                  </div>
                )}
              </a>
            )
          })}
        </nav>
      </div>

    </aside>
  )
}
