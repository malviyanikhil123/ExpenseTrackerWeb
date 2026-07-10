import React, { useState, useRef, useEffect } from "react"
import { Menu, User, Settings, LogOut, ChevronRight, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { CustomDrawer } from "../drawers/CustomDrawer"
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)

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

      {/* 2. Sidebar Drawer - Slide in for Mobile navigation (Section 34) */}
      <div className="md:hidden">
        <CustomDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          title="Navigation"
        >
          <div className="h-full flex flex-col justify-between -mx-6 -my-6 bg-gray-50/50">
            <Sidebar
              activeId={activeNavId}
              onItemSelect={(id) => {
                onNavSelect(id)
                setIsMobileMenuOpen(false)
              }}
              isCollapsed={false}
              onLogout={onLogout}
              className="border-r-0 h-[calc(85vh-72px)]"
            />
          </div>
        </CustomDrawer>
      </div>

      {/* 3. Main Frame: Header + independent content scroller */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* Sticky Header (Section 23) */}
        <header className="h-[72px] border-b border-border bg-card text-card-foreground sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between shrink-0">

          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <Menu className="size-5.5" />
            </button>

            {/* Breadcrumb - Desktop only (Section 24) */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center gap-1.5 text-[15px] font-semibold text-muted-foreground">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="size-3.5 text-muted-foreground select-none" />}
                      {isLast ? (
                        <span className="font-semibold text-foreground leading-none select-none">
                          {crumb.label}
                        </span>
                      ) : (
                        <span className="hover:text-foreground transition-colors select-none leading-none cursor-pointer">
                          {crumb.label}
                        </span>
                      )}
                    </React.Fragment>
                  )
                })}
              </nav>
            )}
          </div>

          {/* Header Actions & Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell Dropdown */}
            <div className="relative flex" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full hover:bg-muted text-primary hover:text-primary-hover transition-colors relative cursor-pointer outline-none flex items-center justify-center"
              >
                <Bell className="size-5 text-primary" />
                {notificationDebts.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-danger text-[9px] font-extrabold text-white flex items-center justify-center ring-2 ring-card select-none">
                    {notificationDebts.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-[320px] sm:w-[360px] bg-[#FAF7F1] border border-border rounded-[16px] shadow-dropdown py-3 px-4 z-40 animate-dropdown origin-top-right">
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
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors outline-none"
              >
                <AvatarComponent
                  src={userAvatarUrl}
                  initials={userDisplayName}
                  size="sm"
                  className="size-8 cursor-pointer"
                />
                <span className="hidden sm:inline text-[15px] font-semibold text-foreground">
                  {userDisplayName}
                </span>
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
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}


