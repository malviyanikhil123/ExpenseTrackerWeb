import React, { createContext, useContext, useEffect, useState } from "react"
import { useProfileDetails } from "../features/profile/hooks/useProfile"
import { applyTheme } from "../hooks/useApplyTheme"

type Theme = "LIGHT" | "DARK" | "SYSTEM"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: profile } = useProfileDetails()
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "SYSTEM"
  })

  // Sync state whenever profile changes
  useEffect(() => {
    if (profile?.theme) {
      setThemeState(profile.theme as Theme)
      applyTheme(profile.theme)
    }
  }, [profile?.theme])

  // Setup listener for system preference changes if in SYSTEM mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    
    if (theme === "SYSTEM") {
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add("dark")
        } else {
          document.documentElement.classList.remove("dark")
        }
      }
      // Apply initial state
      if (mediaQuery.matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
      mediaQuery.addEventListener("change", listener)
      return () => mediaQuery.removeEventListener("change", listener)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    applyTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
