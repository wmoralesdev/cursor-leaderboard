import type { LeaderboardMetric } from "@/server/validation/entry-schemas"

const STANDING_CARD_QUERY_BUDGET = 7

/**
 * Query cost baseline for Rank Insights surfaces.
 *
 * Indexed sort columns (see prisma/schema.prisma):
 * - agentsTotal, tokensTotal, currentStreakDays, longestStreakDays
 * - joinedDaysAgo, longestAgentHours
 * - country + agentsTotal composite
 *
 * Expensive patterns to avoid on hot paths:
 * - jsonb_array_elements_text on topModels per request (use model cache)
 * - Per-row rank fanout in leaderboard table rendering
 * - Multi-metric rank for every visible row
 * - Live country/model aggregates without TTL cache
 */

export const QUERY_BASELINE = {
  leaderboardPage: {
    queries: 2,
    description: "findMany + count with indexed orderBy",
  },
  standingCard: {
    queries: STANDING_CARD_QUERY_BUDGET,
    description: "entry + global rank/total + country rank/total + optional milestone row",
  },
  searchEntries: {
    queriesPerResult: 1,
    description: "findMany candidates + count + one rank query per candidate (cap via SEARCH_MAX_RESULTS)",
  },
  countryStats: {
    queries: 4,
    description: "groupBy + top-3 window + top-model SQL + header cache",
    cacheRecommended: true,
  },
  countryDetail: {
    queries: 0,
    description: "served from CountryDetailCache after background recompute",
  },
  modelDetail: {
    queries: 0,
    description: "served from ModelStatsCache after background recompute",
  },
} as const
export const INDEXED_LEADERBOARD_METRICS: LeaderboardMetric[] = [
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
  "joined",
  "longestAgent",
]
