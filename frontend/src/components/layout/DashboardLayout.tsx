import React, { useState } from "react"
import { Menu, User, Settings, LogOut, ChevronRight, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./Sidebar"
import { CustomDrawer } from "../drawers/CustomDrawer"
import { AvatarComponent } from "../ui/AvatarComponent"

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
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Toggle profile menu dropdown
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  // Click away for profile menu
  React.useEffect(() => {
    const clickAway = () => setIsProfileMenuOpen(false)
    window.addEventListener("click", clickAway)
    return () => window.removeEventListener("click", clickAway)
  }, [])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
      
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
        <header className="h-[72px] border-b border-gray-200 bg-white sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between shrink-0">
          
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <Menu className="size-5.5" />
            </button>

            {/* Breadcrumb - Desktop only (Section 24) */}
            {breadcrumbs.length > 0 && (
              <nav className="hidden sm:flex items-center gap-1.5 text-sm font-normal text-gray-500">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1
                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && <ChevronRight className="size-3.5 text-gray-300 select-none" />}
                      {isLast ? (
                        <span className="font-semibold text-gray-900 leading-none select-none">
                          {crumb.label}
                        </span>
                      ) : (
                        <span className="hover:text-gray-800 transition-colors select-none leading-none">
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
            <button
              type="button"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors relative"
            >
              <Bell className="size-5" />
              <span className="absolute top-1 right-1.5 size-2 rounded-full bg-danger ring-2 ring-white" />
            </button>

            {/* Profile Dropdown Toggle (Section 23 / 35) */}
            <div className="relative">
              <button
                type="button"
                onClick={handleProfileClick}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors outline-none"
              >
                <AvatarComponent
                  src={userAvatarUrl}
                  initials={userDisplayName}
                  size="sm"
                  className="size-8 cursor-pointer"
                />
                <span className="hidden sm:inline text-sm font-semibold text-gray-800">
                  {userDisplayName}
                </span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-[16px] shadow-dropdown py-2 z-30">
                  <div className="px-4 py-2 border-b border-gray-100 flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">{userDisplayName}</span>
                    <span className="text-xs text-gray-400 truncate">{userEmail}</span>
                  </div>
                  
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => onNavSelect("profile")}
                      className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2.5"
                    >
                      <User className="size-4 text-gray-400" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavSelect("profile")}
                      className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2.5"
                    >
                      <Settings className="size-4 text-gray-400" />
                      Change Password
                    </button>
                  </div>

                  <div className="border-t border-gray-100 pt-1 mt-1">
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
        <main className="flex-1 overflow-y-auto bg-white p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
