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
  /** Country-level aggregate for global rank (sum for agents/tokens, max for streaks). */
  metricTotal: string
  globalRank: number | null
  topThree: CountryTopEntryDto[]
}

export type CountryStatsDto = {
  metric: LeaderboardMetric
  /** Metric used to order countries globally and for in-country top 3. */
  globalRankBy: LeaderboardMetric
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
  metricTotal: bigint | number
}

function compareMetricTotals(a: bigint | number, b: bigint | number): number {
  if (typeof a === "bigint" && typeof b === "bigint") {
    return b > a ? 1 : b < a ? -1 : 0
  }
  return Number(b) - Number(a)
}

function serializeMetricTotal(value: bigint | number): string {
  return typeof value === "bigint" ? value.toString() : String(value)
}

export function buildCountryStatsDto(input: {
  metric: LeaderboardMetric
  aggregates: CountryAggregate[]
  topByCountry: Map<string, LeaderboardEntry[]>
}): CountryStatsDto {
  const ranked = [...input.aggregates]
    .filter((a) => a.profileCount > 0)
    .sort((a, b) => {
      const byMetric = compareMetricTotals(b.metricTotal, a.metricTotal)
      if (byMetric !== 0) return byMetric
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
      metricTotal: serializeMetricTotal(agg.metricTotal),
      globalRank: globalRankByCode.get(agg.country) ?? null,
      topThree: topEntries.map((entry, index) =>
        serializeCountryTopEntry(entry, index + 1, input.metric),
      ),
    }
  })

  return {
    metric: input.metric,
    globalRankBy: input.metric,
    topMetric: input.metric,
    countries,
  }
}
