import React, { useState, useRef, useEffect } from "react"
import { User, Settings, LogOut, ChevronRight, Bell, Search, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { MobileBottomNav } from "./MobileBottomNav"
import { AvatarComponent } from "../ui/AvatarComponent"
import type { Debt } from "../../features/debts/api/debtsApi"

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface DashboardLayoutProps {
  activeNavId: string
  onNavSelect: (id: string) => void
  breadcrumbs?: BreadcrumbItem[]
  children?: React.ReactNode
  onLogout?: () => void
  userDisplayName?: string
  userEmail?: string
  userAvatarUrl?: string
  debts?: Debt[]
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeNavId,
  onNavSelect,
  breadcrumbs = [],
  children,
  onLogout,
  userDisplayName = "Nikhil Malviya",
  userEmail = "nikhil@example.com",
  userAvatarUrl,
  debts = [],
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLElement>(null)

  // Toggle profile menu dropdown
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  // Click away for profile menu and notifications dropdown
  useEffect(() => {
    const clickAway = () => {
      setIsProfileMenuOpen(false)
    }
    window.addEventListener("click", clickAway)

    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      window.removeEventListener("click", clickAway)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Filter debts that have a due date and are pending
  const notificationDebts = (debts || []).filter(
    (debt) => debt.dueDate && debt.status === "PENDING"
  )

  // Format date helper
  const formatDueNotificationDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  // Check if a date has passed or is today
  const isOverdue = (dateStr: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const d = new Date(dateStr)
      d.setHours(0, 0, 0, 0)
      return d <= today
    } catch {
      return false
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">

      {/* 1. Sidebar - Fixed on Desktop & Tablet (Section 21) */}
      <div className="hidden md:block select-none shrink-0 h-full">
        <Sidebar
          activeId={activeNavId}
          onItemSelect={onNavSelect}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onLogout={onLogout}
        />
      </div>



      {/* 3. Main Frame: Header + independent content scroller */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* Sticky Header (Section 23) */}
        <header className="h-16 border-b border-sidebar-border/30 bg-background/80 backdrop-blur-md sticky top-0 z-10 px-6 flex items-center justify-between shrink-0 select-none shadow-sm gap-4">

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-muted text-secondary transition-colors cursor-pointer items-center justify-center outline-none"
          >
            <Menu className="size-5" />
          </button>

          {/* Mobile Logo Branding */}
          <div className="md:hidden flex items-center shrink-0">
            <span className="font-bold text-primary text-[18px] tracking-tight">Spendra</span>
          </div>

          <div className="hidden sm:flex items-center flex-1">
            <div className="relative w-full max-w-md focus-within:ring-2 focus-within:ring-primary/20 rounded-full transition-all">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary opacity-60 size-4" />
              <input
                className="w-full pl-10 pr-4 py-2 bg-muted border-none rounded-full text-[14px] focus:ring-0 focus:outline-none placeholder:text-muted-foreground text-foreground"
                placeholder="Search insights or transactions..."
                type="text"
              />
            </div>
          </div>

          {/* Header Actions & Profile Dropdown */}
          <div className="flex items-center gap-4">
            {/* Notifications Bell Dropdown */}
            <div className="relative flex" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="hover:bg-muted rounded-full p-2 relative text-secondary transition-colors outline-none cursor-pointer flex items-center justify-center"
              >
                <Bell className="size-5" />
                {notificationDebts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#a43a3a] rounded-full"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-[320px] sm:w-[360px] bg-popover border border-border rounded-[16px] shadow-dropdown py-3 px-4 z-40 animate-dropdown origin-top-right">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                    <span className="text-sm font-bold text-foreground">Notifications</span>
                    {notificationDebts.length > 0 && (
                      <span className="text-2xs bg-danger/10 text-danger px-2 py-0.5 rounded-full font-bold">
                        {notificationDebts.length} Pending
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-none">
                    {notificationDebts.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                        No pending due date notifications.
                      </div>
                    ) : (
                      notificationDebts.map((debt) => {
                        const amountVal = Number(debt.totalAmount || 0)
                        const formattedAmount = `₹${amountVal.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`
                        const dueTodayOrOverdue = isOverdue(debt.dueDate!)

                        return (
                          <div
                            key={debt.id}
                            onClick={() => {
                              onNavSelect("debts")
                              setIsNotificationsOpen(false)
                            }}
                            className={cn(
                              "p-3 rounded-[12px] border border-border bg-card hover:bg-muted/40 transition-colors cursor-pointer text-left flex flex-col gap-1.5",
                              dueTodayOrOverdue && "border-danger/25 bg-danger/2"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[13px] font-bold text-foreground">
                                {debt.partyName}
                              </span>
                              <span
                                className={cn(
                                  "text-[11px] px-2 py-0.5 rounded-full font-bold",
                                  debt.type === "BORROW"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                )}
                              >
                                {debt.type === "BORROW" ? "Borrowed" : "Lent"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                              {debt.type === "BORROW" ? (
                                <>You borrowed <span className="font-bold text-foreground">{formattedAmount}</span></>
                              ) : (
                                <>You lent <span className="font-bold text-foreground">{formattedAmount}</span></>
                              )}
                            </p>

                            <div className="flex items-center justify-between mt-0.5 text-3xs font-bold uppercase tracking-wider">
                              <span className={cn(
                                "text-muted-foreground",
                                dueTodayOrOverdue && "text-danger"
                              )}>
                                Due: {formatDueNotificationDate(debt.dueDate!)}
                              </span>
                              {dueTodayOrOverdue && (
                                <span className="text-danger flex items-center gap-1 font-extrabold text-[10px]">
                                  ⚠️ Action Required
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Toggle (Section 23 / 35) */}
            <div className="relative">
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex items-center gap-3 border-l border-sidebar-border/30 pl-4 ml-1 select-none focus:outline-none cursor-pointer"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-[14px] font-bold text-foreground leading-tight">{userDisplayName}</p>
                  <p className="text-[12px] text-secondary font-medium mt-0.5">Premium Plan</p>
                </div>
                {userAvatarUrl ? (
                  <img
                    className="w-10 h-10 rounded-full object-cover shadow-sm border border-sidebar-border/20 animate-fade-in"
                    src={userAvatarUrl}
                    alt="User Avatar"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm select-none border border-sidebar-border/20 shadow-sm shrink-0">
                    {userDisplayName
                      ? userDisplayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()
                      : "U"}
                  </div>
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-[16px] shadow-dropdown py-2 z-30">
                  <div className="px-4 py-2 border-b border-border flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{userDisplayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => onNavSelect("profile")}
                      className="w-full h-10 px-4 text-left text-sm text-foreground/90 hover:bg-muted flex items-center gap-2.5"
                    >
                      <User className="size-4 text-muted-foreground" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavSelect("profile")}
                      className="w-full h-10 px-4 text-left text-sm text-foreground/90 hover:bg-muted flex items-center gap-2.5"
                    >
                      <Settings className="size-4 text-muted-foreground" />
                      Change Password
                    </button>
                  </div>

                  <div className="border-t border-border pt-1 mt-1">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full h-10 px-4 text-left text-sm text-danger hover:bg-danger/5 flex items-center gap-2.5"
                    >
                      <LogOut className="size-4 text-danger" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* independent page content container scrollable */}
        <main ref={mainContentRef} className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8 pb-24 md:pb-6 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeId={activeNavId}
          onNavSelect={onNavSelect}
          scrollContainerRef={mainContentRef}
        />
      </div>
    </div>
  )
}


