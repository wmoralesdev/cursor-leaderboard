import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { parseCursorProfileHtml } from "@/server/lib/parse-cursor-profile"

const fixtureDir = dirname(fileURLToPath(import.meta.url))
const fixturePath = join(fixtureDir, "../fixtures/profile-wmoralesdev.html")

describe("parseCursorProfileHtml", () => {
  const html = readFileSync(fixturePath, "utf8")

  it("parses wmoralesdev fixture stats", () => {
    const result = parseCursorProfileHtml(html, "wmoralesdev")
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.stats.displayName).toBe("Walter Morales")
    expect(result.stats.isAmbassador).toBe(true)
    expect(result.stats.joinedDaysAgo).toBe(639)
    expect(result.stats.agentsTotal).toBe(770)
    expect(result.stats.agentsLocal).toBe(745)
    expect(result.stats.agentsCloud).toBe(25)
    expect(result.stats.currentStreakDays).toBe(19)
    expect(result.stats.longestStreakDays).toBe(37)
    expect(result.stats.longestAgentHours).toBe(4.1)
    expect(result.stats.tokensTotal).toBe(2_100_000_000n)
    expect(result.stats.topModels.length).toBeGreaterThanOrEqual(1)
    expect(result.stats.topModels[0]).toContain("Composer")
  })

  it("parses compact Agents totals (K, M, B)", () => {
    const htmlK = `<!DOCTYPE html><html><body><h1>John Paul Poliquit</h1><p>@jpl</p>
      <span>Agents</span><span>1.1K</span>
      <span>Tokens</span><span>5.2B</span>
      <span>Longest Streak</span><span>30d</span>
      Local (907) Cloud (145)`
    const resultK = parseCursorProfileHtml(htmlK, "jpl")
    expect(resultK.ok).toBe(true)
    if (!resultK.ok) return
    expect(resultK.stats.agentsTotal).toBe(1100)

    const htmlM = `<!DOCTYPE html><html><body><h1>Power User</h1><p>@big</p>
      <span>Agents</span><span>2.5M</span>
      <span>Tokens</span><span>1B</span>
      <span>Longest Streak</span><span>7d</span>`
    const resultM = parseCursorProfileHtml(htmlM, "big")
    expect(resultM.ok).toBe(true)
    if (!resultM.ok) return
    expect(resultM.stats.agentsTotal).toBe(2_500_000)
  })
})
