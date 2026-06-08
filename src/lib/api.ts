import { createServerFn } from "@tanstack/react-start"

import { handleDbError, isMissingSchemaError } from "@/server/lib/handle-db-error"
import type { CountryRankBy } from "@/lib/country-rank"
import type { CountryStatsDto } from "@/server/lib/serialize-country-stats"
import type { CountryDetailDto } from "@/server/services/country-detail-cache-service"
import type { ModelStatsDto } from "@/server/services/model-stats-cache-service"
import type { EntryDto } from "@/server/lib/serialize-entry"

export type { EntryDto }
export type { CountryStatsDto, CountryStatsHeaderDto, CountryStatsItemDto, CountryTopEntryDto } from "@/server/lib/serialize-country-stats"
export type { CountryDetailDto } from "@/server/services/country-detail-cache-service"
export type { ModelStatsDto } from "@/server/services/model-stats-cache-service"

export type MetricKey =
  | "agents"
  | "tokens"
  | "currentStreak"
  | "longestStreak"
  | "longestAgent"
  | "joined"

export type SortOrder = "asc" | "desc"

export type LeaderboardPageSize = 25 | 50 | 100

export type LeaderboardStatsSums = {
  agents: number
  tokens: string
  currentStreak: number
  longestStreak: number
}

export type LeaderboardStatsDto = {
  profileCount: number
  sums: LeaderboardStatsSums
  computedAt: string
}

export type LeaderboardResult = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  models: string[]
  page: number
  limit: LeaderboardPageSize
  total: number
  entries: EntryDto[]
  stats: LeaderboardStatsDto
}

export type StandingScopeStatsDto = {
  rank: number | null
  total: number
  percentile: number | null
}

export type StandingMilestoneDto = {
  targetRank: number
  positionsAway: number
  label: string
}

export type EntryInsightDto = {
  kind: string
  label: string
  value: string
}

export type StandingCardDto = {
  entry: EntryDto
  metric: MetricKey
  order: SortOrder
  global: StandingScopeStatsDto
  country: (StandingScopeStatsDto & { code: string }) | null
  milestone: StandingMilestoneDto | null
  insights: EntryInsightDto[]
}

export type SubmitResult = {
  entry: EntryDto
  rank: number | null
  rankMetric: MetricKey
  rankScope: string
  standing?: StandingCardDto
}

export type LookupResult = {
  entry: EntryDto
  rank: number | null
  rankMetric: MetricKey
  rankOrder: SortOrder
  rankScope: string | null
  page: number | null
  total: number
}

export type SearchResultItem = {
  entry: EntryDto
  rank: number | null
  page: number | null
}

export type SearchResult = {
  query: string
  metric: MetricKey
  order: SortOrder
  rankScope: string | null
  total: number
  results: SearchResultItem[]
}

export class LookupError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "LookupError"
    this.status = status
  }
}

export const getCountryStats = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { rankBy?: CountryRankBy; order?: SortOrder }) => input,
  )
  .handler(async ({ data }): Promise<CountryStatsDto> => {
    const { getCountryStats: fetchCountryStats } = await import(
      "@/server/services/entries-service"
    )
    const { buildCountryStatsDto } = await import(
      "@/server/lib/serialize-country-stats"
    )

    try {
      const { COUNTRY_RANK_PROFILES } = await import("@/lib/country-rank")
      const rankBy = data.rankBy ?? COUNTRY_RANK_PROFILES
      const order = data.order ?? "desc"
      const result = await fetchCountryStats({ rankBy, order })
      return buildCountryStatsDto(result)
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const getCountryDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }): Promise<CountryDetailDto> => {
    const {
      getCountryDetail: fetchCountryDetail,
      serializeCountryDetail,
    } = await import("@/server/services/country-detail-cache-service")

    try {
      const detail = await fetchCountryDetail(data.code)
      if (!detail) {
        throw new LookupError("Country not found on the leaderboard.", 404)
      }
      return serializeCountryDetail(detail)
    } catch (error) {
      if (error instanceof LookupError) throw error
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const listModelStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<ModelStatsDto[]> => {
    const {
      listModelStats: fetchModelStats,
      serializeModelStats,
    } = await import("@/server/services/model-stats-cache-service")

    try {
      const models = await fetchModelStats()
      return models.map(serializeModelStats)
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  },
)

export const getModelStats = createServerFn({ method: "GET" })
  .inputValidator((input: { model: string }) => input)
  .handler(async ({ data }): Promise<ModelStatsDto> => {
    const {
      getModelStats: fetchModelStats,
      serializeModelStats,
    } = await import("@/server/services/model-stats-cache-service")

    try {
      const stats = await fetchModelStats(data.model)
      if (!stats) {
        throw new LookupError("Model not found on the leaderboard.", 404)
      }
      return serializeModelStats(stats)
    } catch (error) {
      if (error instanceof LookupError) throw error
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const getTopModels = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ models: string[] }> => {
    const { getDistinctTopModels } = await import(
      "@/server/services/entries-service"
    )

    try {
      const models = await getDistinctTopModels()
      return { models }
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  },
)

export const getLeaderboardStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<LeaderboardStatsDto> => {
    const { getLeaderboardStats: fetchStats, serializeLeaderboardStats } =
      await import("@/server/services/leaderboard-stats-service")

    try {
      const stats = await fetchStats()
      return serializeLeaderboardStats(stats)
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  },
)

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      metric: MetricKey
      order?: SortOrder
      country?: string | null
      models?: string[]
      page?: number
      limit?: LeaderboardPageSize
    }) => input
  )
  .handler(async ({ data }): Promise<LeaderboardResult> => {
    const {
      getLeaderboard: getLeaderboardEntries,
      rankForLeaderboardPage,
    } = await import("@/server/services/entries-service")
    const { serializeEntry } = await import("@/server/lib/serialize-entry")

    try {
      const order = data.order ?? "desc"
      const page = data.page ?? 1
      const limit = data.limit ?? 100
      const models = data.models ?? []
      const [{ entries, total }, stats] = await Promise.all([
        getLeaderboardEntries({
          metric: data.metric,
          order,
          country: data.country ?? undefined,
          models,
          page,
          limit,
        }),
        import("@/server/services/leaderboard-stats-service").then(
          async ({ getLeaderboardStats, serializeLeaderboardStats }) =>
            serializeLeaderboardStats(await getLeaderboardStats()),
        ),
      ])

      return {
        metric: data.metric,
        order,
        country: data.country ?? null,
        models,
        page,
        limit,
        total,
        entries: entries.map((entry, index) =>
          serializeEntry(
            entry,
            rankForLeaderboardPage({ order, total, page, limit, index }),
          ),
        ),
        stats,
      }
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const searchLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      q: string
      metric: MetricKey
      order?: SortOrder
      country?: string | null
      models?: string[]
      limit?: LeaderboardPageSize
    }) => input,
  )
  .handler(async ({ data }): Promise<SearchResult> => {
    const { searchEntries } = await import("@/server/services/entries-service")
    const { serializeEntry } = await import("@/server/lib/serialize-entry")

    const order = data.order ?? "desc"
    const limit = data.limit ?? 100
    const country = data.country ?? undefined

    try {
      const result = await searchEntries({
        query: data.q,
        metric: data.metric,
        order,
        country,
        models: data.models ?? [],
        limit,
      })

      return {
        query: result.query,
        metric: data.metric,
        order,
        rankScope: data.country ?? null,
        total: result.total,
        results: result.results.map(({ entry, rank, page }) => ({
          entry: serializeEntry(entry, rank ?? undefined),
          rank,
          page,
        })),
      }
    } catch (error) {
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const lookupEntry = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      handle: string
      metric: MetricKey
      order?: SortOrder
      country?: string | null
      models?: string[]
      limit?: LeaderboardPageSize
    }) => input,
  )
  .handler(async ({ data }): Promise<LookupResult> => {
    const { lookupEntry: lookupEntryByHandle } = await import(
      "@/server/services/entries-service"
    )
    const { serializeEntry } = await import("@/server/lib/serialize-entry")
    const { InvalidHandleError } = await import("@/server/lib/normalize-handle")

    const order = data.order ?? "desc"
    const limit = data.limit ?? 100
    const country = data.country ?? undefined

    try {
      const result = await lookupEntryByHandle({
        rawHandle: data.handle,
        metric: data.metric,
        order,
        country,
        models: data.models ?? [],
        limit,
      })

      if (!result) {
        const { getEntryByHandle } = await import(
          "@/server/services/entries-service"
        )
        const existing = await getEntryByHandle(data.handle)
        if (!existing) {
          throw new LookupError("Profile not on the leaderboard.", 404)
        }

        return {
          entry: serializeEntry(existing),
          rank: null,
          rankMetric: data.metric,
          rankOrder: order,
          rankScope: data.country ?? null,
          page: null,
          total: 0,
        }
      }

      const { entry, rank, page, total } = result
      return {
        entry: serializeEntry(entry, rank),
        rank,
        rankMetric: data.metric,
        rankOrder: order,
        rankScope: data.country ?? null,
        page,
        total,
      }
    } catch (error) {
      if (error instanceof LookupError) throw error
      if (error instanceof InvalidHandleError) {
        throw new LookupError(error.message, 400)
      }
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export const getStandingCard = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      handle: string
      metric: MetricKey
      order?: SortOrder
      models?: string[]
    }) => input,
  )
  .handler(async ({ data }): Promise<StandingCardDto | null> => {
    const { getStandingCard: fetchStandingCard } = await import(
      "@/server/services/standing-card-service"
    )
    const { InvalidHandleError } = await import("@/server/lib/normalize-handle")

    try {
      return await fetchStandingCard({
        rawHandle: data.handle,
        metric: data.metric,
        order: data.order,
        models: data.models,
      })
    } catch (error) {
      if (error instanceof InvalidHandleError) {
        throw new LookupError(error.message, 400)
      }
      if (!process.env.DATABASE_URL) {
        throw new Error(
          "DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.",
        )
      }
      if (isMissingSchemaError(error)) {
        throw new Error(
          "Leaderboard tables are missing. Run: pnpm db:migrate:deploy",
        )
      }
      const dbResponse = handleDbError(error)
      if (dbResponse) {
        const body = (await dbResponse.json()) as { error?: string }
        throw new Error(body.error ?? "Database error")
      }
      throw error
    }
  })

export class SubmitError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "SubmitError"
    this.status = status
  }
}

export async function submitEntry(input: {
  handle: string
  country: string
}): Promise<SubmitResult> {
  const response = await fetch("/api/entries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  const payload = (await response.json().catch(() => null)) as
    | (SubmitResult & { error?: string })
    | { error?: string }
    | null

  if (!response.ok) {
    const message =
      (payload && "error" in payload && payload.error) ||
      `Request failed (${response.status})`
    throw new SubmitError(message, response.status)
  }

  return payload as SubmitResult
}
