import React, { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Coins,
  BarChart3,
} from "lucide-react"

export interface MobileBottomNavProps {
  activeId: string
  onNavSelect: (id: string) => void
  /** Pass the scrollable container ref so we can track scroll direction */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
}

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: Receipt, label: "Transactions" },
  { id: "accounts", icon: Wallet, label: "Accounts" },
  { id: "debts", icon: Coins, label: "Debts" },
  { id: "analytics", icon: BarChart3, label: "Analytics" },
]

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeId,
  onNavSelect,
  scrollContainerRef,
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef?.current
    if (!container) return

    const currentScrollY = container.scrollTop
    const delta = currentScrollY - lastScrollY

    // Scroll down → hide, Scroll up → show
    if (delta > 8) {
      setIsVisible(false)
    } else if (delta < -8) {
      setIsVisible(true)
    }

    // Always show when at the top
    if (currentScrollY < 20) {
      setIsVisible(true)
    }

    setLastScrollY(currentScrollY)
  }, [lastScrollY, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef?.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll, scrollContainerRef])

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
    >
      <div
        className="pointer-events-auto flex items-center justify-around w-full py-2 px-2 rounded-full border border-white/[0.08]"
        style={{
          background: "rgba(78, 34, 15, 0.55)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          boxShadow: "0 8px 32px rgba(78, 34, 15, 0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          marginBottom: "12px",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isVisible ? "translateY(0)" : "translateY(calc(100% + 24px))",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeId === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavSelect(item.id)}
              className="relative flex items-center justify-center outline-none cursor-pointer group"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                background: isActive
                  ? "rgba(157, 102, 56, 0.9)"
                  : "transparent",
              }}
              aria-label={item.label}
            >
              <Icon
                className="transition-all duration-200"
                style={{
                  width: "20px",
                  height: "20px",
                  color: isActive
                    ? "#FAF7F1"
                    : "rgba(247, 241, 222, 0.5)",
                  strokeWidth: isActive ? 2.2 : 1.8,
                }}
              />

              {/* Active dot indicator */}
              {isActive && (
                <span
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    width: "4px",
                    height: "4px",
                    background: "#FAF7F1",
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
