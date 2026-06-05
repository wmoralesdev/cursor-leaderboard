import { useCallback, useEffect, useState } from "react"

import {
  applyThemePreference,
  readStoredTheme,
  writeStoredTheme,
  type ThemePreference,
} from "@/lib/theme"

function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>("system")

  useEffect(() => {
    const stored = readStoredTheme()
    setPreferenceState(stored)
    applyThemePreference(stored)
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    writeStoredTheme(next)
    applyThemePreference(next)
  }, [])

  useEffect(() => {
    if (preference !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyThemePreference("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  return { preference, setPreference }
}

export { useTheme }
