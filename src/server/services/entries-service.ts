import { Prisma } from "@/generated/prisma/client"
import type {
  LeaderboardEntry,
  Prisma as PrismaTypes,
} from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"
import { normalizeHandle, profileUrlForHandle } from "@/server/lib/normalize-handle"
import { scrapeCursorProfile } from "@/server/lib/scrape-cursor-profile"
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
    case "agents":
    default:
      return { agentsTotal: order }
  }
}

function metricField(metric: LeaderboardMetric): keyof LeaderboardEntry {
  switch (metric) {
    case "tokens":
      return "tokensTotal"
    case "currentStreak":
      return "currentStreakDays"
    case "longestStreak":
      return "longestStreakDays"
    case "agents":
    default:
      return "agentsTotal"
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
  return applyScrapeToEntry(handle, country)
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

export type LeaderboardPageResult = {
  entries: LeaderboardEntry[]
  total: number
  page: number
  limit: number
}

export async function getLeaderboard(options: {
  metric: LeaderboardMetric
  order?: SortOrder
  country?: string
  page?: number
  limit: number
}): Promise<LeaderboardPageResult> {
  const order = options.order ?? "desc"
  const page = options.page ?? 1
  const limit = options.limit
  const where = {
    scrapeStatus: "ok" as const,
    ...(options.country ? { country: options.country } : {}),
  }

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
): Promise<number | null> {
  if (entry.scrapeStatus !== "ok") return null

  const field = metricField(metric)
  const value = entry[field]

  const ahead = await prisma.leaderboardEntry.count({
    where: {
      scrapeStatus: "ok",
      ...(country ? { country } : {}),
      [field]: { gt: value },
    },
  })

  return ahead + 1
}

const METRIC_SQL_COLUMN: Record<LeaderboardMetric, string> = {
  agents: "agentsTotal",
  tokens: "tokensTotal",
  currentStreak: "currentStreakDays",
  longestStreak: "longestStreakDays",
}

type CountryAggregateRow = {
  country: string
  profileCount: number
  metricTotal?: bigint | number
}

function countryMetricTotal(
  row: {
    _sum: { agentsTotal: number | null; tokensTotal: bigint | null }
    _max: { currentStreakDays: number | null; longestStreakDays: number | null }
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
    case "agents":
    default:
      return row._sum.agentsTotal ?? 0
  }
}

type TopEntryRow = LeaderboardEntry & { rn: number }

export type CountryStatsResult = {
  rankBy: CountryStatsQuery["rankBy"]
  order: CountryStatsQuery["order"]
  aggregates: CountryAggregateRow[]
  topByCountry: Map<string, LeaderboardEntry[]>
}

export async function getCountryStats(
  options: CountryStatsQuery = {
    rankBy: COUNTRY_RANK_PROFILES,
    order: "desc",
  },
): Promise<CountryStatsResult> {
  const rankBy = options.rankBy ?? COUNTRY_RANK_PROFILES
  const order = options.order ?? "desc"
  const topMetric =
    rankBy === COUNTRY_RANK_PROFILES ? ("agents" as const) : rankBy
  const orderColumn = METRIC_SQL_COLUMN[topMetric]
  const rankByMetric = rankBy !== COUNTRY_RANK_PROFILES ? rankBy : null

  const [grouped, topRows] = await Promise.all([
    prisma.leaderboardEntry.groupBy({
      by: ["country"],
      where: { scrapeStatus: "ok" },
      _count: { _all: true },
      _sum: { agentsTotal: true, tokensTotal: true },
      _max: { currentStreakDays: true, longestStreakDays: true },
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

  return { rankBy, order, aggregates, topByCountry }
}
