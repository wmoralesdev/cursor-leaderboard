import { Bot, Coins, Flame, type LucideIcon, TrendingUp } from "lucide-react"

import type { EntryDto, MetricKey } from "@/lib/api"
import type { CountryRankBy } from "@/lib/country-rank"
import { COUNTRY_RANK_PROFILES } from "@/lib/country-rank"

export type MetricMeta = {
  key: MetricKey
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const METRICS: MetricMeta[] = [
  { key: "agents", label: "Agents", shortLabel: "Agents", icon: Bot },
  { key: "tokens", label: "Tokens", shortLabel: "Tokens", icon: Coins },
  {
    key: "currentStreak",
    label: "Current Streak",
    shortLabel: "Current",
    icon: TrendingUp,
  },
  {
    key: "longestStreak",
    label: "Longest Streak",
    shortLabel: "Longest",
    icon: Flame,
  },
]

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const integerFormatter = new Intl.NumberFormat("en-US")

export function formatInt(value: number): string {
  return integerFormatter.format(value)
}

export function formatCompact(value: number | bigint): string {
  return compactFormatter.format(value)
}

/** Display agents like cursor.com (K / M / B compact). Sort/rank uses raw `agentsTotal`. */
export function formatAgents(count: number): string {
  return formatCompact(count)
}

export function formatTokens(tokens: string): string {
  try {
    return compactFormatter.format(BigInt(tokens))
  } catch {
    return tokens
  }
}

export function formatMetricValue(metric: MetricKey, entry: EntryDto): string {
  switch (metric) {
    case "tokens":
      return formatTokens(entry.tokensTotal)
    case "currentStreak":
      return `${entry.currentStreakDays}d`
    case "longestStreak":
      return `${entry.longestStreakDays}d`
    case "agents":
    default:
      return formatAgents(entry.agentsTotal)
  }
}

export function countryRankDescription(rankBy: CountryRankBy): string {
  if (rankBy === COUNTRY_RANK_PROFILES) {
    return "Countries ranked by how many profiles joined from each country."
  }
  switch (rankBy) {
    case "tokens":
      return "Countries ranked by combined tokens across profiles in each country."
    case "currentStreak":
      return "Countries ranked by the highest current streak in each country."
    case "longestStreak":
      return "Countries ranked by the longest streak in each country."
    case "agents":
    default:
      return "Countries ranked by total agents across profiles in each country."
  }
}

export function metricUnitLabel(metric: MetricKey): string {
  switch (metric) {
    case "tokens":
      return "tokens"
    case "currentStreak":
    case "longestStreak":
      return "day streak"
    case "agents":
    default:
      return "agents"
  }
}

