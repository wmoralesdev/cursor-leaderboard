import { createServerFn } from "@tanstack/react-start"

import { handleDbError, isMissingSchemaError } from "@/server/lib/handle-db-error"
import type { CountryRankBy } from "@/lib/country-rank"
import type { CountryStatsDto } from "@/server/lib/serialize-country-stats"
import type { EntryDto } from "@/server/lib/serialize-entry"

export type { EntryDto }
export type { CountryStatsDto, CountryStatsItemDto, CountryTopEntryDto } from "@/server/lib/serialize-country-stats"

export type MetricKey = "agents" | "tokens" | "currentStreak" | "longestStreak"

export type SortOrder = "asc" | "desc"

export type LeaderboardPageSize = 25 | 50 | 100

export type LeaderboardResult = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  page: number
  limit: LeaderboardPageSize
  total: number
  entries: EntryDto[]
}

export type SubmitResult = {
  entry: EntryDto
  rank: number | null
  rankMetric: MetricKey
  rankScope: string
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

export const getLeaderboard = createServerFn({ method: "GET" })
  .inputValidator(
    (input: {
      metric: MetricKey
      order?: SortOrder
      country?: string | null
      page?: number
      limit?: LeaderboardPageSize
    }) => input
  )
  .handler(async ({ data }): Promise<LeaderboardResult> => {
    const { getLeaderboard: getLeaderboardEntries } = await import(
      "@/server/services/entries-service"
    )
    const { serializeEntry } = await import("@/server/lib/serialize-entry")

    try {
      const order = data.order ?? "desc"
      const page = data.page ?? 1
      const limit = data.limit ?? 100
      const { entries, total } = await getLeaderboardEntries({
        metric: data.metric,
        order,
        country: data.country ?? undefined,
        page,
        limit,
      })

      const rankOffset = (page - 1) * limit

      return {
        metric: data.metric,
        order,
        country: data.country ?? null,
        page,
        limit,
        total,
        entries: entries.map((entry, index) =>
          serializeEntry(entry, rankOffset + index + 1),
        ),
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
