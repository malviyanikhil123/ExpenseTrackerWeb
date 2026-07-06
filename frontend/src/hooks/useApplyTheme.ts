import { useEffect } from "react"
import { useProfileDetails } from "../features/profile/hooks/useProfile"

export function applyTheme(themeName: string) {
  localStorage.setItem("theme", "LIGHT")
  document.documentElement.classList.remove("dark")
}

export function useApplyTheme() {
  // Always apply LIGHT theme on load
  useEffect(() => {
    applyTheme("LIGHT")
  }, [])
}
