import { describe, expect, it } from "vitest"
import { parseCompactCount } from "@/server/lib/parse-compact-count"

describe("parseCompactCount", () => {
  it("parses plain integers", () => {
    expect(parseCompactCount("770")).toBe(770)
    expect(parseCompactCount("907")).toBe(907)
  })

  it("parses K suffix values", () => {
    expect(parseCompactCount("1.1K")).toBe(1100)
    expect(parseCompactCount("1.1k")).toBe(1100)
    expect(parseCompactCount("6K")).toBe(6000)
  })

  it("parses M and B suffix values", () => {
    expect(parseCompactCount("2.5M")).toBe(2_500_000)
    expect(parseCompactCount("2.5m")).toBe(2_500_000)
    expect(parseCompactCount("1.5M")).toBe(1_500_000)
    expect(parseCompactCount("5.2B")).toBe(5_200_000_000)
    expect(parseCompactCount("5.2b")).toBe(5_200_000_000)
  })
})
