import { describe, expect, it } from "vitest"

import {
  extractSearchTerm,
  matchCountryCodes,
  matchScore,
} from "./normalize-search-query"

describe("extractSearchTerm", () => {
  it("strips @ prefix", () => {
    expect(extractSearchTerm("@wmoralesdev")).toBe("wmoralesdev")
  })

  it("parses cursor profile URLs", () => {
    expect(extractSearchTerm("cursor.com/@wmoralesdev")).toBe("wmoralesdev")
  })

  it("lowercases handle terms", () => {
    expect(extractSearchTerm("WMoralesDev")).toBe("wmoralesdev")
  })
})

describe("matchCountryCodes", () => {
  it("matches country names partially", () => {
    expect(matchCountryCodes("india")).toEqual(["IN"])
  })

  it("matches ISO codes", () => {
    expect(matchCountryCodes("br")).toEqual(["BR"])
  })

  it("resolves common aliases", () => {
    expect(matchCountryCodes("uk")).toEqual(["GB"])
  })
})

describe("matchScore", () => {
  const entry = {
    handle: "wmoralesdev",
    displayName: "Walter Morales",
    country: "US",
  }

  it("prefers exact handle matches", () => {
    expect(matchScore(entry, "wmoralesdev", "wmoralesdev", [])).toBe(0)
  })

  it("prefers handle prefix over display name", () => {
    expect(matchScore(entry, "wmor", "wmor", [])).toBeLessThan(
      matchScore(entry, "walt", "walt", []),
    )
  })

  it("ranks country matches below profile matches", () => {
    expect(matchScore(entry, "walt", "walt", ["US"])).toBeLessThan(
      matchScore(entry, "united", "united", ["US"]),
    )
  })
})
