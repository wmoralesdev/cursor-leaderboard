import { Prisma } from "@/generated/prisma/client"
import type {
  LeaderboardEntry,
  Prisma as PrismaTypes,
} from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"
import {
  extractSearchTerm,
  matchCountryCodes,
  SEARCH_MAX_RESULTS,
  SEARCH_MIN_LENGTH,
} from "@/server/lib/normalize-search-query"
import { normalizeHandle, profileUrlForHandle } from "@/server/lib/normalize-handle"
import { scrapeCursorProfile } from "@/server/lib/scrape-cursor-profile"
import {
  getCountryStatsHeader,
  invalidateCountryStatsCache,
} from "@/server/services/country-stats-cache-service"
import { invalidateCountryDetailCache } from "@/server/services/country-detail-cache-service"
import { invalidateModelStatsCache } from "@/server/services/model-stats-cache-service"
import type { CountryStatsHeaderCache } from "@/server/services/country-stats-cache-service"
import { invalidateLeaderboardStatsCache } from "@/server/services/leaderboard-stats-service"
import type {
  LeaderboardMetric,
  SortOrder,
} from "@/server/validation/entry-schemas"
import { COUNTRY_RANK_PROFILES } from "@/lib/country-rank"
import type {
  CountryStatsMetric,
  CountryStatsQuery,
} from "@/server/validation/country-stats-schemas"

export class RefreshCooldownError extends Error {
  readonly retryAfterSeconds: number

  constructor(retryAfterSeconds: number) {
    super("Refresh cooldown active")
    this.name = "RefreshCooldownError"
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export class EntryNotFoundError extends Error {
  constructor() {
    super("Entry not found")
    this.name = "EntryNotFoundError"
  }
}

function scrapeCooldownMs(): number {
  const minutes = Number.parseInt(
    process.env.SCRAPE_COOLDOWN_MINUTES ?? "15",
    10,
  )
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 15) * 60 * 1000
}

function scrapeMaxAgeMs(): number {
  const hours = Number.parseFloat(process.env.SCRAPE_MAX_AGE_HOURS ?? "24")
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * 60 * 60 * 1000
}

function scrapeErrorRetryMs(): number {
  const hours = Number.parseFloat(process.env.SCRAPE_ERROR_RETRY_HOURS ?? "1")
  return (Number.isFinite(hours) && hours > 0 ? hours : 1) * 60 * 60 * 1000
}

function scrapeBatchLimit(): number {
  const limit = Number.parseInt(process.env.SCRAPE_BATCH_LIMIT ?? "50", 10)
  return Number.isFinite(limit) && limit > 0 ? limit : 50
}

type DueEntrySlice = Pick<LeaderboardEntry, "scrapedAt" | "scrapeStatus">

export function isEntryDueForRescrape(
  entry: DueEntrySlice,
  options?: {
    now?: Date
    maxAgeMs?: number
    errorRetryMs?: number
  },
): boolean {
  if (!entry.scrapedAt) return true

  const now = options?.now ?? new Date()
  const elapsed = now.getTime() - entry.scrapedAt.getTime()
  const maxAge =
    entry.scrapeStatus === "parse_error"
      ? (options?.errorRetryMs ?? scrapeErrorRetryMs())
      : (options?.maxAgeMs ?? scrapeMaxAgeMs())

  return elapsed >= maxAge
}

function buildDueEntryWhere(now: Date = new Date()): PrismaTypes.LeaderboardEntryWhereInput {
  const okCutoff = new Date(now.getTime() - scrapeMaxAgeMs())
  const errorCutoff = new Date(now.getTime() - scrapeErrorRetryMs())

  return {
    OR: [
      { scrapedAt: null },
      {
        scrapeStatus: "parse_error",
        scrapedAt: { lt: errorCutoff },
      },
      {
        scrapeStatus: { in: ["ok", "not_found"] },
        scrapedAt: { lt: okCutoff },
      },
    ],
  }
}

export async function listDueEntries(options?: {
  limit?: number
  now?: Date
}): Promise<Array<{ handle: string }>> {
  const limit = options?.limit ?? scrapeBatchLimit()

  return prisma.leaderboardEntry.findMany({
    where: buildDueEntryWhere(options?.now),
    select: { handle: true },
    orderBy: { scrapedAt: { sort: "asc", nulls: "first" } },
    take: limit,
  })
}

function orderByForMetric(
  metric: LeaderboardMetric,
  order: SortOrder,
): PrismaTypes.LeaderboardEntryOrderByWithRelationInput {
  switch (metric) {
    case "tokens":
      return { tokensTotal: order }
    case "currentStreak":
      return { currentStreakDays: order }
    case "longestStreak":
      return { longestStreakDays: order }
    case "longestAgent":
      return { longestAgentHours: order }
    case "joined":
      return { joinedDaysAgo: { sort: order, nulls: "last" } }
    case "agents":
    default:
      return { agentsTotal: order }
  }
}

export function metricField(metric: LeaderboardMetric): keyof LeaderboardEntry {
  switch (metric) {
    case "tokens":
      return "tokensTotal"
    case "currentStreak":
      return "currentStreakDays"
    case "longestStreak":
      return "longestStreakDays"
    case "longestAgent":
      return "longestAgentHours"
    case "joined":
      return "joinedDaysAgo"
    case "agents":
    default:
      return "agentsTotal"
  }
}

export function buildEntryWhere(options: {
  country?: string
  models?: string[]
}): PrismaTypes.LeaderboardEntryWhereInput {
  const models = options.models?.filter(Boolean) ?? []

  return {
    scrapeStatus: "ok",
    ...(options.country ? { country: options.country } : {}),
    ...(models.length > 0
      ? { OR: models.map((m) => ({ topModels: { array_contains: m } })) }
      : {}),
  }
}

async function applyScrapeToEntry(
  handle: string,
  country: string,
): Promise<LeaderboardEntry> {
  const scrape = await scrapeCursorProfile(handle)
  const profileUrl = profileUrlForHandle(handle)

  if (scrape.status === "not_found") {
    return prisma.leaderboardEntry.upsert({
      where: { handle },
      create: {
        handle,
        country,
        profileUrl,
        scrapeStatus: "not_found",
        scrapeError: "Profile not found on cursor.com",
        scrapedAt: new Date(),
      },
      update: {
        country,
        scrapeStatus: "not_found",
        scrapeError: "Profile not found on cursor.com",
        scrapedAt: new Date(),
      },
    })
  }

  if (scrape.status === "parse_error") {
    return prisma.leaderboardEntry.upsert({
      where: { handle },
      create: {
        handle,
        country,
        profileUrl,
        scrapeStatus: "parse_error",
        scrapeError: scrape.error,
        scrapedAt: new Date(),
      },
      update: {
        country,
        scrapeStatus: "parse_error",
        scrapeError: scrape.error,
        scrapedAt: new Date(),
      },
    })
  }

  const { stats } = scrape
  return prisma.leaderboardEntry.upsert({
    where: { handle },
    create: {
      handle,
      country,
      profileUrl,
      displayName: stats.displayName,
      isAmbassador: stats.isAmbassador,
      joinedDaysAgo: stats.joinedDaysAgo,
      agentsTotal: stats.agentsTotal,
      agentsLocal: stats.agentsLocal,
      agentsCloud: stats.agentsCloud,
      currentStreakDays: stats.currentStreakDays,
      longestStreakDays: stats.longestStreakDays,
      longestAgentHours: stats.longestAgentHours,
      tokensTotal: stats.tokensTotal,
      topModels: stats.topModels,
      scrapeStatus: "ok",
      scrapeError: null,
      scrapedAt: new Date(),
    },
    update: {
      country,
      displayName: stats.displayName,
      profileUrl,
      isAmbassador: stats.isAmbassador,
      joinedDaysAgo: stats.joinedDaysAgo,
      agentsTotal: stats.agentsTotal,
      agentsLocal: stats.agentsLocal,
      agentsCloud: stats.agentsCloud,
      currentStreakDays: stats.currentStreakDays,
      longestStreakDays: stats.longestStreakDays,
      longestAgentHours: stats.longestAgentHours,
      tokensTotal: stats.tokensTotal,
      topModels: stats.topModels,
      scrapeStatus: "ok",
      scrapeError: null,
      scrapedAt: new Date(),
    },
  })
}

export async function submitEntry(
  rawHandle: string,
  country: string,
): Promise<LeaderboardEntry> {
  const handle = normalizeHandle(rawHandle)
  const existing = await prisma.leaderboardEntry.findUnique({ where: { handle } })
  const entry = await applyScrapeToEntry(handle, country)

  if (!existing) {
    await Promise.all([
      invalidateLeaderboardStatsCache(),
      invalidateCountryStatsCache(),
      invalidateCountryDetailCache(),
      invalidateModelStatsCache(),
    ])
  }

  return entry
}

export async function getEntryByHandle(
  rawHandle: string,
): Promise<LeaderboardEntry | null> {
  const handle = normalizeHandle(rawHandle)
  return prisma.leaderboardEntry.findUnique({ where: { handle } })
}

export async function refreshEntry(rawHandle: string): Promise<LeaderboardEntry> {
  const handle = normalizeHandle(rawHandle)
  const existing = await prisma.leaderboardEntry.findUnique({
    where: { handle },
  })

  if (!existing) {
    throw new EntryNotFoundError()
  }

  if (existing.scrapedAt) {
    const elapsed = Date.now() - existing.scrapedAt.getTime()
    const cooldown = scrapeCooldownMs()
    if (elapsed < cooldown) {
      const retryAfterSeconds = Math.ceil((cooldown - elapsed) / 1000)
      throw new RefreshCooldownError(retryAfterSeconds)
    }
  }

  return applyScrapeToEntry(handle, existing.country)
}

/** Re-scrape a stored entry, bypassing the API refresh cooldown (dev/ops). */
export async function rescrapeEntry(rawHandle: string): Promise<LeaderboardEntry> {
  const handle = normalizeHandle(rawHandle)
  const existing = await prisma.leaderboardEntry.findUnique({
    where: { handle },
  })

  if (!existing) {
    throw new EntryNotFoundError()
  }

  return applyScrapeToEntry(handle, existing.country)
}

export type RescrapeAllResult = {
  ok: number
  failed: number
  errors: Array<{ handle: string; error: string }>
}

/** Re-scrape every leaderboard row (dev/ops). */
export async function rescrapeAllEntries(options?: {
  delayMs?: number
}): Promise<RescrapeAllResult> {
  const delayMs = options?.delayMs ?? 500
  const entries = await prisma.leaderboardEntry.findMany({
    select: { handle: true },
    orderBy: { handle: "asc" },
  })

  const result: RescrapeAllResult = { ok: 0, failed: 0, errors: [] }

  for (let i = 0; i < entries.length; i++) {
    const { handle } = entries[i]
    try {
      const entry = await rescrapeEntry(handle)
      if (entry.scrapeStatus === "ok") {
        result.ok += 1
      } else {
        result.failed += 1
        result.errors.push({
          handle,
          error: entry.scrapeError ?? entry.scrapeStatus,
        })
      }
      console.log(
        `[rescrape] ${i + 1}/${entries.length} ${handle} ${entry.scrapeStatus}`,
      )
    } catch (error) {
      result.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push({ handle, error: message })
      console.error(`[rescrape] ${i + 1}/${entries.length} ${handle} failed: ${message}`)
    }

    if (delayMs > 0 && i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return result
}

/** Re-scrape rows missing tenure or top-models data (dev/ops). */
export async function rescrapeStaleEntries(options?: {
  delayMs?: number
}): Promise<RescrapeAllResult> {
  const delayMs = options?.delayMs ?? 500
  const entries = await prisma.leaderboardEntry.findMany({
    where: {
      scrapeStatus: "ok",
      OR: [{ joinedDaysAgo: null }, { topModels: { equals: [] } }],
    },
    select: { handle: true },
    orderBy: { handle: "asc" },
  })

  const result: RescrapeAllResult = { ok: 0, failed: 0, errors: [] }

  for (let i = 0; i < entries.length; i++) {
    const { handle } = entries[i]
    try {
      const entry = await rescrapeEntry(handle)
      if (entry.scrapeStatus === "ok") {
        result.ok += 1
      } else {
        result.failed += 1
        result.errors.push({
          handle,
          error: entry.scrapeError ?? entry.scrapeStatus,
        })
      }
      console.log(
        `[rescrape] ${i + 1}/${entries.length} ${handle} ${entry.scrapeStatus}`,
      )
    } catch (error) {
      result.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push({ handle, error: message })
      console.error(
        `[rescrape] ${i + 1}/${entries.length} ${handle} failed: ${message}`,
      )
    }

    if (delayMs > 0 && i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return result
}

/** Re-scrape rows past their scrape age (proactive background refresh). */
export async function rescrapeDueEntries(options?: {
  limit?: number
  delayMs?: number
}): Promise<RescrapeAllResult> {
  const delayMs = options?.delayMs ?? 500
  const entries = await listDueEntries({ limit: options?.limit })

  const result: RescrapeAllResult = { ok: 0, failed: 0, errors: [] }

  for (let i = 0; i < entries.length; i++) {
    const { handle } = entries[i]
    try {
      const entry = await rescrapeEntry(handle)
      if (entry.scrapeStatus === "ok") {
        result.ok += 1
      } else {
        result.failed += 1
        result.errors.push({
          handle,
          error: entry.scrapeError ?? entry.scrapeStatus,
        })
      }
      console.log(
        `[rescrape] ${i + 1}/${entries.length} ${handle} ${entry.scrapeStatus}`,
      )
    } catch (error) {
      result.failed += 1
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push({ handle, error: message })
      console.error(
        `[rescrape] ${i + 1}/${entries.length} ${handle} failed: ${message}`,
      )
    }

    if (delayMs > 0 && i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return result
}

export async function getDistinctTopModels(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ model: string }>>(Prisma.sql`
    SELECT DISTINCT elem AS model
    FROM "LeaderboardEntry" e,
         jsonb_array_elements_text(e."topModels") AS elem
    WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
    ORDER BY model ASC
  `)

  return rows.map((row) => row.model)
}

export type LeaderboardPageResult = {
  entries: LeaderboardEntry[]
  total: number
  page: number
  limit: number
}

/** Competitive rank for a row on a paginated leaderboard page. */
export function rankForLeaderboardPage(options: {
  order: SortOrder
  total: number
  page: number
  limit: number
  index: number
}): number {
  const rankOffset = (options.page - 1) * options.limit
  if (options.order === "desc") {
    return rankOffset + options.index + 1
  }
  return options.total - rankOffset - options.index
}

export async function getLeaderboard(options: {
  metric: LeaderboardMetric
  order?: SortOrder
  country?: string
  models?: string[]
  page?: number
  limit: number
}): Promise<LeaderboardPageResult> {
  const order = options.order ?? "desc"
  const page = options.page ?? 1
  const limit = options.limit
  const where = buildEntryWhere({
    country: options.country,
    models: options.models,
  })

  const [entries, total] = await Promise.all([
    prisma.leaderboardEntry.findMany({
      where,
      orderBy: orderByForMetric(options.metric, order),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.leaderboardEntry.count({ where }),
  ])

  return { entries, total, page, limit }
}

export async function getRankForEntry(
  entry: LeaderboardEntry,
  metric: LeaderboardMetric,
  country?: string,
  models?: string[],
): Promise<number | null> {
  return getListPositionForEntry(entry, metric, "desc", country, models)
}

export async function getListPositionForEntry(
  entry: LeaderboardEntry,
  metric: LeaderboardMetric,
  order: SortOrder,
  country?: string,
  models?: string[],
): Promise<number | null> {
  if (entry.scrapeStatus !== "ok") return null

  const field = metricField(metric)
  const value = entry[field]

  if (value === null) return null

  const comparison = order === "desc" ? { gt: value } : { lt: value }
  const scope = buildEntryWhere({ country, models })

  const ahead = await prisma.leaderboardEntry.count({
    where: {
      ...scope,
      [field]: comparison,
    },
  })

  return ahead + 1
}

export type LookupEntryResult = {
  entry: LeaderboardEntry
  rank: number
  page: number
  total: number
}

export type SearchEntryResult = {
  entry: LeaderboardEntry
  rank: number | null
  page: number | null
}

export type SearchEntriesPageResult = {
  query: string
  results: SearchEntryResult[]
  total: number
}

export async function searchEntries(options: {
  query: string
  metric: LeaderboardMetric
  order?: SortOrder
  country?: string
  models?: string[]
  limit: number
  maxResults?: number
}): Promise<SearchEntriesPageResult> {
  const rawQuery = options.query.trim()
  const handleTerm = extractSearchTerm(rawQuery)
  const matchedCountryCodes = matchCountryCodes(rawQuery)

  if (
    rawQuery.length < SEARCH_MIN_LENGTH &&
    handleTerm.length < SEARCH_MIN_LENGTH &&
    matchedCountryCodes.length === 0
  ) {
    return { query: rawQuery, results: [], total: 0 }
  }

  const order = options.order ?? "desc"
  const maxResults = options.maxResults ?? SEARCH_MAX_RESULTS
  const scopeWhere = buildEntryWhere({
    country: options.country,
    models: options.models,
  })

  const orFilters: PrismaTypes.LeaderboardEntryWhereInput[] = []

  if (handleTerm.length >= SEARCH_MIN_LENGTH) {
    orFilters.push({
      handle: { contains: handleTerm, mode: "insensitive" },
    })
  }

  if (rawQuery.length >= SEARCH_MIN_LENGTH) {
    orFilters.push({
      displayName: { contains: rawQuery, mode: "insensitive" },
    })
  }

  if (matchedCountryCodes.length > 0) {
    orFilters.push({
      country: { in: matchedCountryCodes },
    })
  }

  if (orFilters.length === 0) {
    return { query: rawQuery, results: [], total: 0 }
  }

  const candidates = await prisma.leaderboardEntry.findMany({
    where: {
      ...scopeWhere,
      OR: orFilters,
    },
    orderBy: orderByForMetric(options.metric, order),
    take: maxResults,
  })

  const results = await Promise.all(
    candidates.map(async (entry) => {
      const rank = await getListPositionForEntry(
        entry,
        options.metric,
        order,
        options.country,
        options.models,
      )

      return {
        entry,
        rank,
        page: rank === null ? null : Math.ceil(rank / options.limit),
      }
    }),
  )

  const total = await prisma.leaderboardEntry.count({
    where: {
      ...scopeWhere,
      OR: orFilters,
    },
  })

  return { query: rawQuery, results, total }
}

export async function lookupEntry(options: {
  rawHandle: string
  metric: LeaderboardMetric
  order?: SortOrder
  country?: string
  models?: string[]
  limit: number
}): Promise<LookupEntryResult | null> {
  const entry = await getEntryByHandle(options.rawHandle)
  if (!entry) return null

  const order = options.order ?? "desc"
  const rank = await getListPositionForEntry(
    entry,
    options.metric,
    order,
    options.country,
    options.models,
  )
  if (rank === null) return null

  const where = buildEntryWhere({
    country: options.country,
    models: options.models,
  })
  const total = await prisma.leaderboardEntry.count({ where })

  return {
    entry,
    rank,
    page: Math.ceil(rank / options.limit),
    total,
  }
}

const METRIC_SQL_COLUMN: Record<LeaderboardMetric, string> = {
  agents: "agentsTotal",
  tokens: "tokensTotal",
  currentStreak: "currentStreakDays",
  longestStreak: "longestStreakDays",
  longestAgent: "longestAgentHours",
  joined: "joinedDaysAgo",
}

type CountryAggregateRow = {
  country: string
  profileCount: number
  metricTotal?: bigint | number
}

function countryMetricTotal(
  row: {
    _sum: { agentsTotal: number | null; tokensTotal: bigint | null }
    _max: {
      currentStreakDays: number | null
      longestStreakDays: number | null
      longestAgentHours: number | null
    }
  },
  metric: CountryStatsMetric,
): bigint | number {
  switch (metric) {
    case "tokens":
      return row._sum.tokensTotal ?? BigInt(0)
    case "currentStreak":
      return row._max.currentStreakDays ?? 0
    case "longestStreak":
      return row._max.longestStreakDays ?? 0
    case "longestAgent":
      return row._max.longestAgentHours ?? 0
    case "agents":
    default:
      return row._sum.agentsTotal ?? 0
  }
}

type TopEntryRow = LeaderboardEntry & { rn: number }

type TopModelByCountryRow = {
  country: string
  model: string
}

export type CountryStatsResult = {
  rankBy: CountryStatsQuery["rankBy"]
  order: CountryStatsQuery["order"]
  aggregates: CountryAggregateRow[]
  topByCountry: Map<string, LeaderboardEntry[]>
  topModelByCountry: Map<string, string>
  headerCache: CountryStatsHeaderCache
}

export async function getCountryStats(
  options: CountryStatsQuery = {
    rankBy: COUNTRY_RANK_PROFILES,
    order: "desc",
  },
): Promise<CountryStatsResult> {
  const rankBy = options.rankBy
  const order = options.order
  const topMetric =
    rankBy === COUNTRY_RANK_PROFILES ? ("agents" as const) : rankBy
  const orderColumn = METRIC_SQL_COLUMN[topMetric]
  const rankByMetric = rankBy !== COUNTRY_RANK_PROFILES ? rankBy : null

  const [grouped, topRows, topModelRows, headerCache] = await Promise.all([
    prisma.leaderboardEntry.groupBy({
      by: ["country"],
      where: { scrapeStatus: "ok" },
      _count: { _all: true },
      _sum: { agentsTotal: true, tokensTotal: true },
      _max: { currentStreakDays: true, longestStreakDays: true, longestAgentHours: true },
    }),
    prisma.$queryRaw<TopEntryRow[]>(Prisma.sql`
      SELECT *
      FROM (
        SELECT
          e.*,
          ROW_NUMBER() OVER (
            PARTITION BY e.country
            ORDER BY ${Prisma.raw(`e."${orderColumn}"`)} DESC
          )::int AS rn
        FROM "LeaderboardEntry" e
        WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
      ) ranked
      WHERE ranked.rn <= 3
    `),
    prisma.$queryRaw<TopModelByCountryRow[]>(Prisma.sql`
      WITH model_counts AS (
        SELECT
          e.country,
          elem AS model,
          COUNT(DISTINCT e.id)::int AS profile_count
        FROM "LeaderboardEntry" e,
             jsonb_array_elements_text(e."topModels") AS elem
        WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
        GROUP BY e.country, elem
      ),
      ranked AS (
        SELECT
          country,
          model,
          ROW_NUMBER() OVER (
            PARTITION BY country
            ORDER BY profile_count DESC, model ASC
          ) AS rn
        FROM model_counts
      )
      SELECT country, model FROM ranked WHERE rn = 1
    `),
    getCountryStatsHeader(),
  ])

  const aggregates: CountryAggregateRow[] = grouped.map((row) => ({
    country: row.country,
    profileCount: row._count._all,
    ...(rankByMetric
      ? { metricTotal: countryMetricTotal(row, rankByMetric) }
      : {}),
  }))

  const topByCountry = new Map<string, LeaderboardEntry[]>()
  for (const row of topRows) {
    const { rn: _rn, ...entry } = row
    const list = topByCountry.get(entry.country) ?? []
    list.push(entry)
    topByCountry.set(entry.country, list)
  }

  for (const list of topByCountry.values()) {
    list.sort((a, b) => {
      const field = metricField(topMetric)
      const av = a[field]
      const bv = b[field]
      if (typeof av === "bigint" && typeof bv === "bigint") {
        return bv > av ? 1 : bv < av ? -1 : 0
      }
      return (bv as number) - (av as number)
    })
  }

  const topModelByCountry = new Map<string, string>(
    topModelRows.map((row) => [row.country, row.model]),
  )

  return {
    rankBy,
    order,
    aggregates,
    topByCountry,
    topModelByCountry,
    headerCache,
  }
}
