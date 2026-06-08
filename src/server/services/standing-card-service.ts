import type { MetricKey } from "@/lib/api"
import { buildEntryInsights } from "@/lib/entry-insights"
import type { EntryInsight } from "@/lib/entry-insights"
import {
  STANDING_CARD_MAX_QUERIES,
  STANDING_CARD_MILESTONE_RANKS,
} from "@/lib/insight-scope"
import type { EntryDto } from "@/server/lib/serialize-entry"
import { serializeEntry } from "@/server/lib/serialize-entry"
import { prisma } from "@/server/db/prisma"
import {
  buildEntryWhere,
  getEntryByHandle,
  getListPositionForEntry,
} from "@/server/services/entries-service"
import type {
  LeaderboardMetric,
  SortOrder,
} from "@/server/validation/entry-schemas"

export type StandingScopeStats = {
  rank: number | null
  total: number
  percentile: number | null
}

export type StandingMilestone = {
  targetRank: number
  positionsAway: number
  label: string
}

export type StandingCard = {
  entry: EntryDto
  metric: MetricKey
  order: SortOrder
  global: StandingScopeStats
  country: (StandingScopeStats & { code: string }) | null
  milestone: StandingMilestone | null
  insights: EntryInsight[]
}

function percentile(rank: number, total: number): number | null {
  if (total <= 0) return null
  return Math.round(((total - rank + 1) / total) * 100)
}

function nextMilestoneRank(rank: number): number | null {
  let best: number | null = null
  for (const target of STANDING_CARD_MILESTONE_RANKS) {
    if (rank > target) best = target
  }
  if (best !== null) return best
  return rank > 1 ? 1 : null
}

function milestoneLabel(targetRank: number): string {
  if (targetRank === 1) return "Top spot"
  return `Top ${targetRank}`
}

export async function getStandingCard(options: {
  rawHandle: string
  metric: LeaderboardMetric
  order?: SortOrder
  models?: string[]
}): Promise<StandingCard | null> {
  const order = options.order ?? "desc"
  const models = options.models?.filter(Boolean) ?? []

  const entry = await getEntryByHandle(options.rawHandle)
  if (!entry || entry.scrapeStatus !== "ok") return null

  let queryCount = 1

  const globalTotal = await prisma.leaderboardEntry.count({
    where: buildEntryWhere({ models }),
  })
  queryCount += 1

  const globalRank = await getListPositionForEntry(
    entry,
    options.metric,
    order,
    undefined,
    models,
  )
  queryCount += 1

  let countryStats: (StandingScopeStats & { code: string }) | null = null
  if (entry.country) {
    const countryTotal = await prisma.leaderboardEntry.count({
      where: buildEntryWhere({ country: entry.country, models }),
    })
    queryCount += 1

    const countryRank = await getListPositionForEntry(
      entry,
      options.metric,
      order,
      entry.country,
      models,
    )
    queryCount += 1

    countryStats = {
      code: entry.country,
      rank: countryRank,
      total: countryTotal,
      percentile:
        countryRank !== null ? percentile(countryRank, countryTotal) : null,
    }
  }

  let milestone: StandingMilestone | null = null
  if (globalRank !== null) {
    const targetRank = nextMilestoneRank(globalRank)
    if (targetRank !== null) {
      milestone = {
        targetRank,
        positionsAway: globalRank - targetRank,
        label: milestoneLabel(targetRank),
      }
    }
  }

  if (queryCount > STANDING_CARD_MAX_QUERIES) {
    console.warn(
      `[standing-card] query budget exceeded: ${queryCount} > ${STANDING_CARD_MAX_QUERIES}`,
    )
  }

  const entryDto = serializeEntry(entry, globalRank ?? undefined)
  const insights = buildEntryInsights(entryDto)

  return {
    entry: entryDto,
    metric: options.metric,
    order,
    global: {
      rank: globalRank,
      total: globalTotal,
      percentile:
        globalRank !== null ? percentile(globalRank, globalTotal) : null,
    },
    country: countryStats,
    milestone,
    insights,
  }
}

export type StandingCardDto = StandingCard
