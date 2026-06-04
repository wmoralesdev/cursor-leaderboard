import type { MetricKey } from "@/lib/api"

export const COUNTRY_RANK_PROFILES = "profiles" as const

export type CountryRankBy = typeof COUNTRY_RANK_PROFILES | MetricKey

export const COUNTRY_RANK_BY_VALUES: CountryRankBy[] = [
  COUNTRY_RANK_PROFILES,
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
]

export function isCountryRankBy(value: string): value is CountryRankBy {
  return COUNTRY_RANK_BY_VALUES.includes(value as CountryRankBy)
}

export function topMetricForRank(rankBy: CountryRankBy): MetricKey {
  return rankBy === COUNTRY_RANK_PROFILES ? "agents" : rankBy
}
