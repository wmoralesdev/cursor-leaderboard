import type { EntryDto, MetricKey } from "@/lib/api"

export type EntryInsightKind =
  | "localShare"
  | "cloudShare"
  | "agentsPerDay"
  | "tokensPerAgent"
  | "streakNearBest"

export type EntryInsight = {
  kind: EntryInsightKind
  label: string
  value: string
}

function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`
}

function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  })
}

/** Derived display metrics from fields already on the entry — no extra queries. */
export function buildEntryInsights(entry: EntryDto): EntryInsight[] {
  const insights: EntryInsight[] = []

  const agentTotal = entry.agentsTotal
  if (agentTotal > 0) {
    if (entry.agentsLocal > 0) {
      insights.push({
        kind: "localShare",
        label: "Local share",
        value: formatPercent(entry.agentsLocal / agentTotal),
      })
    }
    if (entry.agentsCloud > 0) {
      insights.push({
        kind: "cloudShare",
        label: "Cloud share",
        value: formatPercent(entry.agentsCloud / agentTotal),
      })
    }
  }

  if (
    entry.joinedDaysAgo !== null &&
    entry.joinedDaysAgo > 0 &&
    agentTotal > 0
  ) {
    insights.push({
      kind: "agentsPerDay",
      label: "Agents/day",
      value: formatDecimal(agentTotal / entry.joinedDaysAgo),
    })
  }

  if (agentTotal > 0) {
    try {
      const tokens = BigInt(entry.tokensTotal)
      if (tokens > 0n) {
        const perAgent = Number(tokens) / agentTotal
        if (Number.isFinite(perAgent) && perAgent >= 1) {
          insights.push({
            kind: "tokensPerAgent",
            label: "Tokens/agent",
            value: formatCompactTokensPerAgent(perAgent),
          })
        }
      }
    } catch {
      // ignore invalid token strings
    }
  }

  if (
    entry.longestStreakDays > 0 &&
    entry.currentStreakDays > 0 &&
    entry.currentStreakDays >= entry.longestStreakDays * 0.85
  ) {
    const atBest = entry.currentStreakDays >= entry.longestStreakDays
    insights.push({
      kind: "streakNearBest",
      label: atBest ? "Streak at best" : "Near streak best",
      value: atBest
        ? `${entry.currentStreakDays}d`
        : `${entry.currentStreakDays}/${entry.longestStreakDays}d`,
    })
  }

  return insights
}

function formatCompactTokensPerAgent(value: number): string {
  if (value >= 1_000_000_000) return `${formatDecimal(value / 1_000_000_000)}B`
  if (value >= 1_000_000) return `${formatDecimal(value / 1_000_000)}M`
  if (value >= 1_000) return `${formatDecimal(value / 1_000)}K`
  return formatDecimal(value, 0)
}

export function formatInsightSummary(insights: EntryInsight[]): string | null {
  if (insights.length === 0) return null
  return insights.map((i) => `${i.label}: ${i.value}`).join(" · ")
}

const METRIC_CONTEXT_PRIORITY: Record<MetricKey, EntryInsightKind[]> = {
  agents: ["agentsPerDay", "tokensPerAgent"],
  tokens: ["tokensPerAgent", "agentsPerDay"],
  currentStreak: ["streakNearBest", "agentsPerDay"],
  longestStreak: ["streakNearBest", "agentsPerDay"],
  longestAgent: ["agentsPerDay", "tokensPerAgent"],
  joined: ["agentsPerDay"],
}

/** One metric-aware insight for the leaderboard row context line. */
export function pickInsightForMetric(
  metric: MetricKey,
  entry: EntryDto,
): EntryInsight | null {
  const insights = buildEntryInsights(entry)
  for (const kind of METRIC_CONTEXT_PRIORITY[metric]) {
    const match = insights.find((insight) => insight.kind === kind)
    if (match) return match
  }
  return null
}

export function formatRowContextItem(insight: EntryInsight): string {
  switch (insight.kind) {
    case "agentsPerDay":
      return `${insight.value} agents/day`
    case "tokensPerAgent":
      return `${insight.value} tokens/agent`
    case "streakNearBest":
      return insight.label === "Streak at best"
        ? `${insight.value} streak at best`
        : `${insight.value} near streak best`
    default:
      return `${insight.label}: ${insight.value}`
  }
}

/** Dominant local/cloud mix as a short muted label, e.g. "83% cloud". */
export function dominantAgentMixLabel(entry: EntryDto): string | null {
  const total = entry.agentsTotal
  if (total <= 0) return null

  const localShare = entry.agentsLocal / total
  const cloudShare = entry.agentsCloud / total

  if (localShare >= cloudShare && entry.agentsLocal > 0) {
    return `${Math.round(localShare * 100)}% local`
  }
  if (entry.agentsCloud > 0) {
    return `${Math.round(cloudShare * 100)}% cloud`
  }
  return null
}

export function buildRowContextItems(
  metric: MetricKey,
  entry: EntryDto,
): string[] {
  const items: string[] = []
  const insight = pickInsightForMetric(metric, entry)
  if (insight) items.push(formatRowContextItem(insight))

  const mix = dominantAgentMixLabel(entry)
  if (mix) items.push(mix)

  return items
}
