import { describe, expect, it } from "vitest"
import { parseTokenCount } from "@/server/lib/parse-token-count"

describe("parseTokenCount", () => {
  it("parses billions", () => {
    expect(parseTokenCount("2.1B tokens")).toBe(2_100_000_000n)
  })

  it("parses millions and thousands", () => {
    expect(parseTokenCount("500M")).toBe(500_000_000n)
    expect(parseTokenCount("12K")).toBe(12_000n)
  })

  it("parses plain numbers", () => {
    expect(parseTokenCount("1200")).toBe(1200n)
  })

  it("returns null for invalid input", () => {
    expect(parseTokenCount("")).toBeNull()
    expect(parseTokenCount("n/a")).toBeNull()
  })
})
