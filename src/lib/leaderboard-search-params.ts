import {
  createParser,
  createStandardSchemaV1,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringLiteral
  
} from "nuqs/server"
import type {inferParserType} from "nuqs/server";

import type { LeaderboardPageSize, MetricKey, SortOrder } from "@/lib/api"

export const METRIC_KEYS = [
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
] as const satisfies readonly MetricKey[]

export const SORT_ORDERS = ["asc", "desc"] as const satisfies readonly SortOrder[]

export const PAGE_SIZES = [25, 50, 100] as const satisfies readonly LeaderboardPageSize[]

const shallowLoaderOptions = { shallow: false } as const

const parseAsPage = createParser({
  parse(value) {
    const n = Number.parseInt(value, 10)
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null
  },
  serialize(value) {
    return String(value)
  },
})
  .withDefault(1)
  .withOptions(shallowLoaderOptions)

const parseAsCountryCode = createParser({
  parse(value) {
    const upper = value.toUpperCase()
    return /^[A-Z]{2}$/.test(upper) ? upper : null
  },
  serialize(value) {
    return value
  },
}).withOptions(shallowLoaderOptions)

export const leaderboardSearchParams = {
  metric: parseAsStringLiteral(METRIC_KEYS)
    .withDefault("agents")
    .withOptions(shallowLoaderOptions),
  order: parseAsStringLiteral(SORT_ORDERS)
    .withDefault("desc")
    .withOptions(shallowLoaderOptions),
  country: parseAsCountryCode,
  page: parseAsPage,
  limit: parseAsNumberLiteral(PAGE_SIZES)
    .withDefault(100)
    .withOptions(shallowLoaderOptions),
  q: parseAsString.withDefault(""),
}

export const leaderboardSearchSchema = createStandardSchemaV1(
  leaderboardSearchParams,
  { partialOutput: true },
)

export type LeaderboardSearch = inferParserType<typeof leaderboardSearchParams>

export type LeaderboardSeoSearch = {
  metric: MetricKey
  order: SortOrder
  country?: string
  page: number
  limit: LeaderboardPageSize
}

export function toLeaderboardSeoSearch(
  search: Partial<LeaderboardSearch>,
): LeaderboardSeoSearch {
  const base = {
    metric: search.metric ?? "agents",
    order: search.order ?? "desc",
    page: search.page ?? 1,
    limit: search.limit ?? 100,
  }

  return search.country ? { ...base, country: search.country } : base
}
