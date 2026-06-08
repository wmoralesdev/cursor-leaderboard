import { z } from "zod"

import { COUNTRY_RANK_PROFILES } from "@/lib/country-rank"
import { sortOrderSchema } from "@/server/validation/entry-schemas"

const leaderboardMetricSchema = z.enum([
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
  "longestAgent",
])

export const countryRankBySchema = z
  .union([z.literal(COUNTRY_RANK_PROFILES), leaderboardMetricSchema])
  .default(COUNTRY_RANK_PROFILES)

export const countryStatsQuerySchema = z.object({
  rankBy: countryRankBySchema,
  order: sortOrderSchema,
})

export type CountryStatsQuery = z.infer<typeof countryStatsQuerySchema>
export type CountryStatsMetric = z.infer<typeof leaderboardMetricSchema>
