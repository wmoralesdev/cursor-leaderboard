import { Bot, Coins, Flame, type LucideIcon, TrendingUp } from "lucide-react"

import type { EntryDto, MetricKey } from "@/lib/api"

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
      return formatInt(entry.agentsTotal)
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
