import { useEffect } from "react"
import { useProfileDetails } from "../features/profile/hooks/useProfile"

export function applyTheme(themeName: string) {
  localStorage.setItem("theme", themeName)
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
  const isDark =
    themeName === "DARK" ||
    (themeName === "SYSTEM" && mediaQuery.matches)

  if (isDark) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
}

export function useApplyTheme() {
  // Retained for backwards compatibility; listeners and sync are managed in ThemeProvider
}
