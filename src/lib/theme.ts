export type ThemePreference = "dark" | "light" | "system"

export const THEME_STORAGE_KEY = "theme"

const PREFERENCES: ThemePreference[] = ["dark", "light", "system"]

export function isThemePreference(value: string | null): value is ThemePreference {
  return value !== null && PREFERENCES.includes(value as ThemePreference)
}

export function resolveIsDark(
  preference: ThemePreference,
  prefersDark: boolean,
): boolean {
  if (preference === "dark") return true
  if (preference === "light") return false
  return prefersDark
}

export function readStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system"
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isThemePreference(stored)) return stored
  } catch {
    /* private mode / blocked storage */
  }
  return "system"
}

export function writeStoredTheme(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    /* ignore */
  }
}

export function applyThemePreference(preference: ThemePreference): void {
  if (typeof document === "undefined") return
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  document.documentElement.classList.toggle(
    "dark",
    resolveIsDark(preference, prefersDark),
  )
}

/** Runs before paint to avoid a flash of the wrong theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var dark=s==="dark"||(s!=="light"&&(s==="system"||!s)&&d);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`
