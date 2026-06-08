import { Prisma } from "@/generated/prisma/client"
import type { CountryDetailCache } from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"
import { getCountryStats } from "@/server/services/entries-service"
import { COUNTRY_RANK_PROFILES } from "@/lib/country-rank"

export const COUNTRY_DETAIL_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type CountryDetailTopBuilder = {
  handle: string
  displayName: string | null
  agentsTotal: number
  tokensTotal: string
  currentStreakDays: number
}

export type CountryDetail = {
  country: string
  profileCount: number
  globalRank: number | null
  topModel: string | null
  avgAgentsTotal: number
  avgCloudShare: number
  maxLongestStreak: number
  topBuilders: CountryDetailTopBuilder[]
  computedAt: Date
}

export type CountryDetailDto = Omit<CountryDetail, "computedAt"> & {
  computedAt: string
}

export function isCountryDetailCacheFresh(
  computedAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() - computedAt.getTime() < COUNTRY_DETAIL_CACHE_TTL_MS
}

export function serializeCountryDetail(detail: CountryDetail): CountryDetailDto {
  return {
    ...detail,
    computedAt: detail.computedAt.toISOString(),
  }
}

function detailFromRow(row: CountryDetailCache): CountryDetail {
  return {
    country: row.country,
    profileCount: row.profileCount,
    globalRank: row.globalRank,
    topModel: row.topModel,
    avgAgentsTotal: row.avgAgentsTotal,
    avgCloudShare: row.avgCloudShare,
    maxLongestStreak: row.maxLongestStreak,
    topBuilders: Array.isArray(row.topBuilders)
      ? (row.topBuilders as CountryDetailTopBuilder[])
      : [],
    computedAt: row.computedAt,
  }
}

type CountryAggregateRow = {
  country: string
  profile_count: number
  avg_agents: number
  avg_cloud_share: number
  max_longest_streak: number
}

export async function invalidateCountryDetailCache(): Promise<void> {
  await prisma.countryDetailCache.deleteMany({})
}

export async function recomputeCountryDetailCache(): Promise<void> {
  const [aggregates, countryStats] = await Promise.all([
    prisma.$queryRaw<CountryAggregateRow[]>(Prisma.sql`
      SELECT
        country,
        COUNT(*)::int AS profile_count,
        AVG("agentsTotal")::float AS avg_agents,
        AVG(
          CASE
            WHEN "agentsTotal" > 0 THEN "agentsCloud"::float / "agentsTotal"::float
            ELSE 0
          END
        )::float AS avg_cloud_share,
        MAX("longestStreakDays")::int AS max_longest_streak
      FROM "LeaderboardEntry"
      WHERE "scrapeStatus" = 'ok'::"ScrapeStatus"
      GROUP BY country
    `),
    getCountryStats({ rankBy: COUNTRY_RANK_PROFILES, order: "desc" }),
  ])

  const globalRankByCountry = new Map(
    countryStats.aggregates
      .filter((row) => row.profileCount > 0)
      .sort((a, b) => b.profileCount - a.profileCount)
      .map((row, index) => [row.country, index + 1]),
  )

  const computedAt = new Date()

  for (const row of aggregates) {
    const topEntries = countryStats.topByCountry.get(row.country) ?? []
    const topBuilders: CountryDetailTopBuilder[] = topEntries
      .slice(0, 5)
      .map((entry) => ({
        handle: entry.handle,
        displayName: entry.displayName,
        agentsTotal: entry.agentsTotal,
        tokensTotal: entry.tokensTotal.toString(),
        currentStreakDays: entry.currentStreakDays,
      }))

    await prisma.countryDetailCache.upsert({
      where: { country: row.country },
      create: {
        country: row.country,
        profileCount: row.profile_count,
        globalRank: globalRankByCountry.get(row.country) ?? null,
        topModel: countryStats.topModelByCountry.get(row.country) ?? null,
        avgAgentsTotal: row.avg_agents,
        avgCloudShare: row.avg_cloud_share,
        maxLongestStreak: row.max_longest_streak,
        topBuilders,
        computedAt,
      },
      update: {
        profileCount: row.profile_count,
        globalRank: globalRankByCountry.get(row.country) ?? null,
        topModel: countryStats.topModelByCountry.get(row.country) ?? null,
        avgAgentsTotal: row.avg_agents,
        avgCloudShare: row.avg_cloud_share,
        maxLongestStreak: row.max_longest_streak,
        topBuilders,
        computedAt,
      },
    })
  }
}

export async function getCountryDetail(
  countryCode: string,
): Promise<CountryDetail | null> {
  const normalized = countryCode.trim().toUpperCase()
  const cached = await prisma.countryDetailCache.findUnique({
    where: { country: normalized },
  })

  if (cached && isCountryDetailCacheFresh(cached.computedAt)) {
    return detailFromRow(cached)
  }

  await recomputeCountryDetailCache()

  const refreshed = await prisma.countryDetailCache.findUnique({
    where: { country: normalized },
  })

  return refreshed ? detailFromRow(refreshed) : null
}

export async function listCountryDetails(): Promise<CountryDetail[]> {
  const rows = await prisma.countryDetailCache.findMany({
    orderBy: { profileCount: "desc" },
  })

  if (
    rows.length === 0 ||
    rows.some((row) => !isCountryDetailCacheFresh(row.computedAt))
  ) {
    await recomputeCountryDetailCache()
    const refreshed = await prisma.countryDetailCache.findMany({
      orderBy: { profileCount: "desc" },
    })
    return refreshed.map(detailFromRow)
  }

  return rows.map(detailFromRow)
}
