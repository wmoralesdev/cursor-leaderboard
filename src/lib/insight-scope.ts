/**
 * First-release insight scope for Rank Insights.
 *
 * In scope:
 * - Standing card: rank, percentile, milestone gap, leaderboard-only context
 * - Cheap derived display metrics on rows/cards (no extra queries)
 * - Cached country and model insight pages
 *
 * Out of scope for v1:
 * - Duplicate Cursor profile pages (/u/{handle})
 * - Live global/model aggregate pages without cache
 * - Sorting/filtering by derived ratios without stored/indexed columns
 * - Live movers/trends (requires snapshot history — see docs/rank-insights-snapshots-plan.md)
 */

export const INSIGHT_SCOPE = {
  standingCard: true,
  profilePage: false,
  liveAggregatePages: false,
  derivedDisplayOnly: true,
  cachedCountryPages: true,
  cachedModelPages: true,
  snapshotHistory: false,
} as const

export const STANDING_CARD_MILESTONE_RANKS = [10, 50, 100] as const

export type StandingMilestoneRank = (typeof STANDING_CARD_MILESTONE_RANKS)[number]

/** Max DB round-trips for a single standing-card request (enforced in service). */
export const STANDING_CARD_MAX_QUERIES = 7
