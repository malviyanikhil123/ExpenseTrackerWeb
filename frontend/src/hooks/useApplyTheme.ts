import { useEffect } from "react"
import { useProfileDetails } from "../features/profile/hooks/useProfile"

export function applyTheme(themeName: string) {
  const root = document.documentElement

  if (themeName === "DARK") {
    root.classList.add("dark")
    localStorage.setItem("theme", "DARK")
  } else if (themeName === "LIGHT") {
    root.classList.remove("dark")
    localStorage.setItem("theme", "LIGHT")
  } else {
    // SYSTEM
    localStorage.setItem("theme", "SYSTEM")
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }
}

export function useApplyTheme() {
  const { data: profile } = useProfileDetails()

  useEffect(() => {
    // On first load, apply from localStorage or default to DARK
    const saved = localStorage.getItem("theme") as "LIGHT" | "DARK" | "SYSTEM" | null
    applyTheme(saved ?? "DARK")
  }, [])

  useEffect(() => {
    if (profile?.theme) {
      applyTheme(profile.theme)
    }
  }, [profile?.theme])
}
