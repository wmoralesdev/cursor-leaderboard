import { Prisma } from "@/generated/prisma/client"
import type { ModelStatsCache } from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"

export const MODEL_STATS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type ModelStatsTopCountry = {
  country: string
  profileCount: number
}

export type ModelStatsTopBuilder = {
  handle: string
  displayName: string | null
  country: string
  agentsTotal: number
  currentStreakDays: number
}

export type ModelStats = {
  model: string
  profileCount: number
  topCountries: ModelStatsTopCountry[]
  topBuilders: ModelStatsTopBuilder[]
  avgAgentsTotal: number
  avgCurrentStreak: number
  computedAt: Date
}

export type ModelStatsDto = Omit<ModelStats, "computedAt"> & {
  computedAt: string
}

export function isModelStatsCacheFresh(
  computedAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() - computedAt.getTime() < MODEL_STATS_CACHE_TTL_MS
}

export function serializeModelStats(stats: ModelStats): ModelStatsDto {
  return {
    ...stats,
    computedAt: stats.computedAt.toISOString(),
  }
}

function statsFromRow(row: ModelStatsCache): ModelStats {
  return {
    model: row.model,
    profileCount: row.profileCount,
    topCountries: Array.isArray(row.topCountries)
      ? (row.topCountries as ModelStatsTopCountry[])
      : [],
    topBuilders: Array.isArray(row.topBuilders)
      ? (row.topBuilders as ModelStatsTopBuilder[])
      : [],
    avgAgentsTotal: row.avgAgentsTotal,
    avgCurrentStreak: row.avgCurrentStreak,
    computedAt: row.computedAt,
  }
}

type ModelAggregateRow = {
  model: string
  profile_count: number
  avg_agents: number
  avg_current_streak: number
}

type ModelCountryRow = {
  model: string
  country: string
  profile_count: number
}

type ModelBuilderRow = {
  model: string
  handle: string
  display_name: string | null
  country: string
  agents_total: number
  current_streak_days: number
}

export async function invalidateModelStatsCache(): Promise<void> {
  await prisma.modelStatsCache.deleteMany({})
}

export async function recomputeModelStatsCache(): Promise<void> {
  const [aggregates, countryRows, builderRows] = await Promise.all([
    prisma.$queryRaw<ModelAggregateRow[]>(Prisma.sql`
      SELECT
        (e."topModels"->>0) AS model,
        COUNT(DISTINCT e.id)::int AS profile_count,
        AVG(e."agentsTotal")::float AS avg_agents,
        AVG(e."currentStreakDays")::float AS avg_current_streak
      FROM "LeaderboardEntry" e
      WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
        AND jsonb_array_length(e."topModels") > 0
      GROUP BY model
      ORDER BY profile_count DESC, model ASC
    `),
    prisma.$queryRaw<ModelCountryRow[]>(Prisma.sql`
      WITH model_countries AS (
        SELECT
          (e."topModels"->>0) AS model,
          e.country,
          COUNT(DISTINCT e.id)::int AS profile_count
        FROM "LeaderboardEntry" e
        WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
          AND jsonb_array_length(e."topModels") > 0
        GROUP BY model, e.country
      ),
      ranked AS (
        SELECT
          model,
          country,
          profile_count,
          ROW_NUMBER() OVER (
            PARTITION BY model
            ORDER BY profile_count DESC, country ASC
          ) AS rn
        FROM model_countries
      )
      SELECT model, country, profile_count
      FROM ranked
      WHERE rn <= 5
    `),
    prisma.$queryRaw<ModelBuilderRow[]>(Prisma.sql`
      WITH model_builders AS (
        SELECT
          (e."topModels"->>0) AS model,
          e.handle,
          e."displayName" AS display_name,
          e.country,
          e."agentsTotal" AS agents_total,
          e."currentStreakDays" AS current_streak_days,
          ROW_NUMBER() OVER (
            PARTITION BY (e."topModels"->>0)
            ORDER BY e."agentsTotal" DESC, e.handle ASC
          ) AS rn
        FROM "LeaderboardEntry" e
        WHERE e."scrapeStatus" = 'ok'::"ScrapeStatus"
          AND jsonb_array_length(e."topModels") > 0
      )
      SELECT model, handle, display_name, country, agents_total, current_streak_days
      FROM model_builders
      WHERE rn <= 5
    `),
  ])

  const countriesByModel = new Map<string, ModelStatsTopCountry[]>()
  for (const row of countryRows) {
    const list = countriesByModel.get(row.model) ?? []
    list.push({ country: row.country, profileCount: row.profile_count })
    countriesByModel.set(row.model, list)
  }

  const buildersByModel = new Map<string, ModelStatsTopBuilder[]>()
  for (const row of builderRows) {
    const list = buildersByModel.get(row.model) ?? []
    list.push({
      handle: row.handle,
      displayName: row.display_name,
      country: row.country,
      agentsTotal: row.agents_total,
      currentStreakDays: row.current_streak_days,
    })
    buildersByModel.set(row.model, list)
  }

  const computedAt = new Date()
  const seenModels = new Set<string>()

  for (const row of aggregates) {
    seenModels.add(row.model)
    await prisma.modelStatsCache.upsert({
      where: { model: row.model },
      create: {
        model: row.model,
        profileCount: row.profile_count,
        topCountries: countriesByModel.get(row.model) ?? [],
        topBuilders: buildersByModel.get(row.model) ?? [],
        avgAgentsTotal: row.avg_agents,
        avgCurrentStreak: row.avg_current_streak,
        computedAt,
      },
      update: {
        profileCount: row.profile_count,
        topCountries: countriesByModel.get(row.model) ?? [],
        topBuilders: buildersByModel.get(row.model) ?? [],
        avgAgentsTotal: row.avg_agents,
        avgCurrentStreak: row.avg_current_streak,
        computedAt,
      },
    })
  }

  await prisma.modelStatsCache.deleteMany({
    where: { model: { notIn: [...seenModels] } },
  })
}

export async function getModelStats(model: string): Promise<ModelStats | null> {
  const cached = await prisma.modelStatsCache.findUnique({
    where: { model },
  })

  if (cached && isModelStatsCacheFresh(cached.computedAt)) {
    return statsFromRow(cached)
  }

  await recomputeModelStatsCache()

  const refreshed = await prisma.modelStatsCache.findUnique({
    where: { model },
  })

  return refreshed ? statsFromRow(refreshed) : null
}

export async function listModelStats(): Promise<ModelStats[]> {
  const rows = await prisma.modelStatsCache.findMany({
    orderBy: { profileCount: "desc" },
  })

  if (
    rows.length === 0 ||
    rows.some((row) => !isModelStatsCacheFresh(row.computedAt))
  ) {
    await recomputeModelStatsCache()
    const refreshed = await prisma.modelStatsCache.findMany({
      orderBy: { profileCount: "desc" },
    })
    return refreshed.map(statsFromRow)
  }

  return rows.map(statsFromRow)
}
