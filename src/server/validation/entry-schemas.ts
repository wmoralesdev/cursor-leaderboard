import { z } from "zod"

import { SEARCH_MIN_LENGTH } from "@/server/lib/normalize-search-query"

export const submitEntrySchema = z.object({
  handle: z.string().min(1).max(200),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Country must be a 2-letter ISO code"),
})

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc")

export const LEADERBOARD_PAGE_SIZES = [25, 50, 100] as const

export const leaderboardPageSizeSchema = z.coerce
  .number()
  .int()
  .pipe(z.union([z.literal(25), z.literal(50), z.literal(100)]))

export const leaderboardMetricSchema = z.enum([
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
  "longestAgent",
  "joined",
])

export const modelsQuerySchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val?.trim()) return [] as string[]
    return val
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0 && m.length <= 200)
  })

export const leaderboardQuerySchema = z.object({
  metric: leaderboardMetricSchema.default("agents"),
  order: sortOrderSchema,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  models: modelsQuerySchema,
  page: z.coerce.number().int().min(1).default(1),
  limit: leaderboardPageSizeSchema.default(100),
})

export const searchEntriesQuerySchema = z.object({
  q: z.string().trim().min(SEARCH_MIN_LENGTH).max(200),
  metric: leaderboardMetricSchema.default("agents"),
  order: sortOrderSchema,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  models: modelsQuerySchema,
  limit: leaderboardPageSizeSchema.default(100),
})

export const lookupEntryQuerySchema = z.object({
  metric: leaderboardMetricSchema.default("agents"),
  order: sortOrderSchema,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  models: modelsQuerySchema,
  limit: leaderboardPageSizeSchema.default(100),
})

export type LeaderboardMetric = z.infer<typeof leaderboardMetricSchema>

export type SortOrder = z.infer<typeof sortOrderSchema>
