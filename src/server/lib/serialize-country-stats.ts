import type { LeaderboardEntry } from "@/generated/prisma/client"
import type { CountryRankBy } from "@/lib/country-rank"
import { COUNTRY_RANK_PROFILES, topMetricForRank } from "@/lib/country-rank"
import type {
  LeaderboardMetric,
  SortOrder,
} from "@/server/validation/entry-schemas"
import type { CountryStatsHeaderCache } from "@/server/services/country-stats-cache-service"

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
  globalRank: number | null
  topModel: string | null
  topThree: CountryTopEntryDto[]
}

export type CountryStatsHeaderDto = {
  countryCount: number
  topModel: string | null
}

export type CountryStatsDto = {
  rankBy: CountryRankBy
  order: SortOrder
  topMetric: LeaderboardMetric
  header: CountryStatsHeaderDto
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
    case "longestAgent":
      return String(entry.longestAgentHours)
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
  metricTotal?: bigint | number
}

function compareMetricTotals(
  a: bigint | number,
  b: bigint | number,
  order: SortOrder,
): number {
  let diff: number
  if (typeof a === "bigint" && typeof b === "bigint") {
    diff = a > b ? 1 : a < b ? -1 : 0
  } else {
    diff = Number(a) - Number(b)
  }
  if (diff !== 0) return order === "asc" ? diff : -diff
  return 0
}

function compareByProfileCount(
  a: CountryAggregate,
  b: CountryAggregate,
  order: SortOrder,
): number {
  const diff = a.profileCount - b.profileCount
  if (diff !== 0) return order === "asc" ? diff : -diff
  return a.country.localeCompare(b.country)
}

function compareCountries(
  a: CountryAggregate,
  b: CountryAggregate,
  rankBy: CountryRankBy,
  order: SortOrder,
): number {
  if (rankBy === COUNTRY_RANK_PROFILES) {
    return compareByProfileCount(a, b, order)
  }
  const aTotal = a.metricTotal ?? 0
  const bTotal = b.metricTotal ?? 0
  const byMetric = compareMetricTotals(aTotal, bTotal, order)
  if (byMetric !== 0) return byMetric
  return compareByProfileCount(a, b, "desc")
}

export function buildCountryStatsDto(input: {
  rankBy: CountryRankBy
  order: SortOrder
  aggregates: CountryAggregate[]
  topByCountry: Map<string, LeaderboardEntry[]>
  topModelByCountry: Map<string, string>
  headerCache: CountryStatsHeaderCache
}): CountryStatsDto {
  const topMetric = topMetricForRank(input.rankBy)

  const ranked = [...input.aggregates]
    .filter((a) => a.profileCount > 0)
    .sort((a, b) => compareCountries(a, b, input.rankBy, input.order))

  const globalRankByCode = new Map(
    ranked.map((row, index) => [row.country, index + 1]),
  )

  const countries = ranked.map((agg) => {
    const topEntries = input.topByCountry.get(agg.country) ?? []
    return {
      country: agg.country,
      profileCount: agg.profileCount,
      globalRank: globalRankByCode.get(agg.country) ?? null,
      topModel: input.topModelByCountry.get(agg.country) ?? null,
      topThree: topEntries.map((entry, index) =>
        serializeCountryTopEntry(entry, index + 1, topMetric),
      ),
    }
  })

  return {
    rankBy: input.rankBy,
    order: input.order,
    topMetric,
    header: {
      countryCount: input.headerCache.countryCount,
      topModel: input.headerCache.topModel,
    },
    countries,
  }
}
