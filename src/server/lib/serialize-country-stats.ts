import type { LeaderboardEntry } from "@/generated/prisma/client"
import type { LeaderboardMetric } from "@/server/validation/entry-schemas"

export type CountryTopEntryDto = {
  rank: number
  handle: string
  displayName: string | null
  agentsTotal: number
  tokensTotal: string
  currentStreakDays: number
  longestStreakDays: number
  metricValue: string
}

export type CountryStatsItemDto = {
  country: string
  profileCount: number
  /** Sum of agentsTotal across ok profiles; used for global country rank. */
  totalAgents: number
  globalRank: number | null
  topThree: CountryTopEntryDto[]
}

export type CountryStatsDto = {
  metric: LeaderboardMetric
  /** Global country ordering uses totalAgents (sum), then profileCount as tiebreaker. */
  globalRankBy: "totalAgents"
  /** In-country top 3 ordering uses the requested metric (default: agents). */
  topMetric: LeaderboardMetric
  countries: CountryStatsItemDto[]
}

function metricValueFor(entry: LeaderboardEntry, metric: LeaderboardMetric): string {
  switch (metric) {
    case "tokens":
      return entry.tokensTotal.toString()
    case "currentStreak":
      return String(entry.currentStreakDays)
    case "longestStreak":
      return String(entry.longestStreakDays)
    case "agents":
    default:
      return String(entry.agentsTotal)
  }
}

export function serializeCountryTopEntry(
  entry: LeaderboardEntry,
  rank: number,
  metric: LeaderboardMetric,
): CountryTopEntryDto {
  return {
    rank,
    handle: entry.handle,
    displayName: entry.displayName,
    agentsTotal: entry.agentsTotal,
    tokensTotal: entry.tokensTotal.toString(),
    currentStreakDays: entry.currentStreakDays,
    longestStreakDays: entry.longestStreakDays,
    metricValue: metricValueFor(entry, metric),
  }
}

export type CountryAggregate = {
  country: string
  profileCount: number
  totalAgents: number
}

export function buildCountryStatsDto(input: {
  metric: LeaderboardMetric
  aggregates: CountryAggregate[]
  topByCountry: Map<string, LeaderboardEntry[]>
}): CountryStatsDto {
  const ranked = [...input.aggregates]
    .filter((a) => a.profileCount > 0)
    .sort((a, b) => {
      if (b.totalAgents !== a.totalAgents) return b.totalAgents - a.totalAgents
      return b.profileCount - a.profileCount
    })

  const globalRankByCode = new Map(
    ranked.map((row, index) => [row.country, index + 1]),
  )

  const countries = ranked.map((agg) => {
    const topEntries = input.topByCountry.get(agg.country) ?? []
    return {
      country: agg.country,
      profileCount: agg.profileCount,
      totalAgents: agg.totalAgents,
      globalRank: globalRankByCode.get(agg.country) ?? null,
      topThree: topEntries.map((entry, index) =>
        serializeCountryTopEntry(entry, index + 1, input.metric),
      ),
    }
  })

  return {
    metric: input.metric,
    globalRankBy: "totalAgents",
    topMetric: input.metric,
    countries,
  }
}
