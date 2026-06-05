import { describe, expect, it } from "vitest"

import { isThemePreference, resolveIsDark } from "./theme"

describe("resolveIsDark", () => {
  it("respects explicit dark and light", () => {
    expect(resolveIsDark("dark", false)).toBe(true)
    expect(resolveIsDark("light", true)).toBe(false)
  })

  it("follows system preference when set to system", () => {
    expect(resolveIsDark("system", true)).toBe(true)
    expect(resolveIsDark("system", false)).toBe(false)
  })
})

describe("isThemePreference", () => {
  it("accepts known values only", () => {
    expect(isThemePreference("dark")).toBe(true)
    expect(isThemePreference("light")).toBe(true)
    expect(isThemePreference("system")).toBe(true)
    expect(isThemePreference("sepia")).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})
