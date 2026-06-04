import { z } from "zod"

export const countryStatsQuerySchema = z.object({
  metric: z
    .enum(["agents", "tokens", "currentStreak", "longestStreak"])
    .default("agents"),
})

export type CountryStatsMetric = z.infer<
  typeof countryStatsQuerySchema
>["metric"]
