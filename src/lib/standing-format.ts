import type { StandingCardDto } from "@/lib/api"
import { countryByCode } from "@/lib/countries"

export type StandingInsightDto = StandingCardDto["insights"][number]

export function formatTopPercent(rank: number, total: number): string {
  return `top ${Math.max(1, Math.round((rank / total) * 100))}%`
}

export function formatGlobalStandingLabel(
  global: StandingCardDto["global"],
): string | null {
  if (global.rank === null || global.total <= 0) return null
  const parts = [`Worldwide · ${formatTopPercent(global.rank, global.total)}`]
  if (global.percentile !== null) {
    parts.push(`beating ${global.percentile}%`)
  }
  return parts.join(" · ")
}

export function formatCountryStandingLabel(
  country: NonNullable<StandingCardDto["country"]>,
): string | null {
  if (country.rank === null || country.total <= 0) return null
  const meta = countryByCode(country.code)
  if (!meta) return null
  const parts = [
    `${meta.flag} ${meta.name} · ${formatTopPercent(country.rank, country.total)}`,
  ]
  if (country.percentile !== null) {
    parts.push(`beating ${country.percentile}%`)
  }
  return parts.join(" · ")
}

export function formatMilestoneLabel(
  milestone: NonNullable<StandingCardDto["milestone"]>,
): string | null {
  if (milestone.positionsAway <= 0) return null
  return `spots from ${milestone.label.toLowerCase()}`
}

export function formatMilestoneValue(
  milestone: NonNullable<StandingCardDto["milestone"]>,
): string | null {
  if (milestone.positionsAway <= 0) return null
  return String(milestone.positionsAway)
}

export function formatGamifiedStandingInsight(
  insight: StandingInsightDto,
): string {
  switch (insight.kind) {
    case "agentsPerDay":
      return `Shipping ${insight.value} agents/day`
    case "localShare":
      return `${insight.value} local`
    case "cloudShare":
      return `${insight.value} cloud`
    case "tokensPerAgent":
      return `${insight.value} tokens per agent`
    case "streakNearBest":
      return insight.label === "Streak at best"
        ? `${insight.value} streak at best`
        : `${insight.value} near streak best`
    default:
      return `${insight.label}: ${insight.value}`
  }
}

export function formatStandingContextItems(
  insights: StandingCardDto["insights"],
): Array<{ kind: StandingInsightDto["kind"]; label: string }> {
  return insights.map((insight) => ({
    kind: insight.kind,
    label: formatGamifiedStandingInsight(insight),
  }))
}

export function formatStandingInsightLine(
  insights: StandingCardDto["insights"],
): string | null {
  if (insights.length === 0) return null
  return insights.map(formatGamifiedStandingInsight).join(" · ")
}
