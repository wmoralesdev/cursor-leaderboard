import { Prisma } from "@/generated/prisma/client"
import type { CountryStatsCache } from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"

export const COUNTRY_STATS_CACHE_ID = "global"
export const COUNTRY_STATS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type CountryStatsHeaderCache = {
  countryCount: number
  topModel: string | null
  computedAt: Date
}

export type CountryStatsHeaderCacheDto = {
  countryCount: number
  topModel: string | null
  computedAt: string
}

type TopModelRow = {
  model: string
  profile_count: number
}

export function isCountryStatsCacheFresh(
  computedAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() - computedAt.getTime() < COUNTRY_STATS_CACHE_TTL_MS
}

export function serializeCountryStatsHeader(
  header: CountryStatsHeaderCache,
): CountryStatsHeaderCacheDto {
  return {
    countryCount: header.countryCount,
    topModel: header.topModel,
    computedAt: header.computedAt.toISOString(),
  }
}

function headerFromCacheRow(row: CountryStatsCache): CountryStatsHeaderCache {
  return {
    countryCount: row.countryCount,
    topModel: row.topModel,
    computedAt: row.computedAt,
  }
}

export async function invalidateCountryStatsCache(): Promise<void> {
  await prisma.countryStatsCache.deleteMany({})
}

export async function recomputeCountryStatsHeader(): Promise<CountryStatsHeaderCache> {
  const [countryCountRow, topModelRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      SELECT COUNT(DISTINCT country)::int AS count
      FROM "LeaderboardEntry"
      WHERE "scrapeStatus" = 'ok'::"ScrapeStatus"
    `),
    prisma.$queryRaw<TopModelRow[]>(Prisma.sql`
      SELECT (e."topModels"->>0) AS model, COUNT(DISTINCT e.id)::int AS profile_count
      FROM "LeaderboardEntry" e
      WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
        AND jsonb_array_length(e."topModels") > 0
      GROUP BY model
      ORDER BY profile_count DESC, model ASC
      LIMIT 1
    `),
  ])

  const computedAt = new Date()
  const header: CountryStatsHeaderCache = {
    countryCount: countryCountRow[0]?.count ?? 0,
    topModel: topModelRows[0]?.model ?? null,
    computedAt,
  }

  await prisma.countryStatsCache.upsert({
    where: { id: COUNTRY_STATS_CACHE_ID },
    create: {
      id: COUNTRY_STATS_CACHE_ID,
      countryCount: header.countryCount,
      topModel: header.topModel,
      computedAt,
    },
    update: {
      countryCount: header.countryCount,
      topModel: header.topModel,
      computedAt,
    },
  })

  return header
}

export async function getCountryStatsHeader(): Promise<CountryStatsHeaderCache> {
  const cached = await prisma.countryStatsCache.findUnique({
    where: { id: COUNTRY_STATS_CACHE_ID },
  })

  if (cached && isCountryStatsCacheFresh(cached.computedAt)) {
    return headerFromCacheRow(cached)
  }

  return recomputeCountryStatsHeader()
}
