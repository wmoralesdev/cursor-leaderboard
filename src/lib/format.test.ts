import { describe, expect, it } from "vitest"
import { formatAgents, formatMetricValue } from "@/lib/format"
import type { EntryDto } from "@/lib/api"

const baseEntry: EntryDto = {
  id: "1",
  handle: "jpl",
  country: "PH",
  displayName: "Test",
  profileUrl: "https://cursor.com/@jpl",
  isAmbassador: false,
  joinedDaysAgo: null,
  agentsTotal: 0,
  agentsLocal: 0,
  agentsCloud: 0,
  currentStreakDays: 0,
  longestStreakDays: 0,
  longestAgentHours: 0,
  tokensTotal: "0",
  topModels: [],
  scrapeStatus: "ok",
  scrapeError: null,
  scrapedAt: null,
  createdAt: "",
  updatedAt: "",
}

describe("formatAgents", () => {
  it("shows K compact notation", () => {
    expect(formatAgents(1100)).toBe("1.1K")
    expect(formatAgents(6000)).toBe("6K")
  })

  it("shows M and B compact notation", () => {
    expect(formatAgents(1_500_000)).toBe("1.5M")
    expect(formatAgents(2_500_000)).toBe("2.5M")
    expect(formatAgents(5_200_000_000)).toBe("5.2B")
  })

  it("shows plain integers below 1K", () => {
    expect(formatAgents(770)).toBe("770")
    expect(formatAgents(1)).toBe("1")
  })
})

describe("formatMetricValue", () => {
  it("formats agents compactly while tokens stay compact", () => {
    expect(
      formatMetricValue("agents", { ...baseEntry, agentsTotal: 1100 }),
    ).toBe("1.1K")
    expect(
      formatMetricValue("tokens", {
        ...baseEntry,
        tokensTotal: "5200000000",
      }),
    ).toBe("5.2B")
  })
})
