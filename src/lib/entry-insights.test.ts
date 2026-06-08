import { describe, expect, it } from "vitest"
import {
  buildEntryInsights,
  buildRowContextItems,
  dominantAgentMixLabel,
  pickInsightForMetric,
} from "@/lib/entry-insights"
import { INSIGHT_SCOPE, STANDING_CARD_MILESTONE_RANKS } from "@/lib/insight-scope"
import type { EntryDto } from "@/lib/api"
import { INDEXED_LEADERBOARD_METRICS } from "@/server/lib/query-baseline"

const baseEntry: EntryDto = {
  id: "1",
  handle: "test",
  country: "US",
  displayName: "Test User",
  profileUrl: "https://cursor.com/@test",
  isAmbassador: false,
  joinedDaysAgo: 100,
  agentsTotal: 500,
  agentsLocal: 475,
  agentsCloud: 25,
  currentStreakDays: 17,
  longestStreakDays: 20,
  longestAgentHours: 4.1,
  tokensTotal: "1000000000",
  topModels: ["Composer"],
  scrapeStatus: "ok",
  scrapeError: null,
  scrapedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("buildEntryInsights", () => {
  it("derives local/cloud share and pace without extra data", () => {
    const insights = buildEntryInsights(baseEntry)
    expect(insights.find((i) => i.kind === "localShare")?.value).toBe("95%")
    expect(insights.find((i) => i.kind === "cloudShare")?.value).toBe("5%")
    expect(insights.find((i) => i.kind === "agentsPerDay")?.value).toBe("5")
    expect(insights.find((i) => i.kind === "tokensPerAgent")?.value).toBe("2M")
  })

  it("flags near streak best", () => {
    const insights = buildEntryInsights(baseEntry)
    expect(insights.some((i) => i.kind === "streakNearBest")).toBe(true)
  })

  it("picks metric-aware context for row metadata", () => {
    expect(pickInsightForMetric("agents", baseEntry)?.kind).toBe("agentsPerDay")
    expect(pickInsightForMetric("tokens", baseEntry)?.kind).toBe("tokensPerAgent")
    expect(pickInsightForMetric("currentStreak", baseEntry)?.kind).toBe(
      "streakNearBest",
    )
  })

  it("builds compact row context with dominant agent mix", () => {
    expect(buildRowContextItems("agents", baseEntry)).toEqual([
      "5 agents/day",
      "95% local",
    ])
    expect(dominantAgentMixLabel(baseEntry)).toBe("95% local")
  })
})

describe("insight scope", () => {
  it("keeps profile pages out of v1", () => {
    expect(INSIGHT_SCOPE.standingCard).toBe(true)
    expect(INSIGHT_SCOPE.profilePage).toBe(false)
  })

  it("defines milestone ranks for standing card", () => {
    expect(STANDING_CARD_MILESTONE_RANKS).toEqual([10, 50, 100])
  })
})

describe("query baseline", () => {
  it("includes longestAgent as indexed metric", () => {
    expect(INDEXED_LEADERBOARD_METRICS).toContain("longestAgent")
  })
})

function nextMilestoneRank(rank: number): number | null {
  let best: number | null = null
  for (const target of STANDING_CARD_MILESTONE_RANKS) {
    if (rank > target) best = target
  }
  if (best !== null) return best
  return rank > 1 ? 1 : null
}

describe("standing card milestones", () => {
  it("picks the next milestone rank", () => {
    expect(nextMilestoneRank(142)).toBe(100)
    expect(nextMilestoneRank(75)).toBe(50)
    expect(nextMilestoneRank(12)).toBe(10)
    expect(nextMilestoneRank(1)).toBeNull()
  })
})

describe("standing card percentile", () => {
  it("computes ahead-of percentile for desc ranks", () => {
    const rank = 42
    const total = 500
    const percentile = Math.round(((total - rank + 1) / total) * 100)
    expect(percentile).toBe(92)
  })
})
