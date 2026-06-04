import { z } from "zod"

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

export const leaderboardQuerySchema = z.object({
  metric: z
    .enum(["agents", "tokens", "currentStreak", "longestStreak"])
    .default("agents"),
  order: sortOrderSchema,
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: leaderboardPageSizeSchema.default(100),
})

export type LeaderboardMetric = z.infer<
  typeof leaderboardQuerySchema
>["metric"]

export type SortOrder = z.infer<typeof sortOrderSchema>
