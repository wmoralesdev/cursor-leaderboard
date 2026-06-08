import type { LeaderboardStatsCache } from "@/generated/prisma/client"
import { prisma } from "@/server/db/prisma"

export const LEADERBOARD_STATS_CACHE_ID = "global"
export const LEADERBOARD_STATS_CACHE_TTL_MS = 24 * 60 * 60 * 1000

export type LeaderboardStatsSums = {
  agents: number
  tokens: string
  currentStreak: number
  longestStreak: number
}

export type LeaderboardStats = {
  profileCount: number
  sums: LeaderboardStatsSums
  computedAt: Date
}

export type LeaderboardStatsDto = {
  profileCount: number
  sums: LeaderboardStatsSums
  computedAt: string
}

export function isLeaderboardStatsCacheFresh(
  computedAt: Date,
  now: Date = new Date(),
): boolean {
  return now.getTime() - computedAt.getTime() < LEADERBOARD_STATS_CACHE_TTL_MS
}

export function serializeLeaderboardStats(
  stats: LeaderboardStats,
): LeaderboardStatsDto {
  return {
    profileCount: stats.profileCount,
    sums: stats.sums,
    computedAt: stats.computedAt.toISOString(),
  }
}

function statsFromCacheRow(row: LeaderboardStatsCache): LeaderboardStats {
  return {
    profileCount: row.profileCount,
    sums: {
      agents: row.agentsSum,
      tokens: row.tokensSum.toString(),
      currentStreak: row.currentStreakSum,
      longestStreak: row.longestStreakSum,
    },
    computedAt: row.computedAt,
  }
}

export async function invalidateLeaderboardStatsCache(): Promise<void> {
  await prisma.leaderboardStatsCache.deleteMany({})
}

export async function recomputeLeaderboardStats(): Promise<LeaderboardStats> {
  const [profileCount, aggregates] = await Promise.all([
    prisma.leaderboardEntry.count({ where: { scrapeStatus: "ok" } }),
    prisma.leaderboardEntry.aggregate({
      where: { scrapeStatus: "ok" },
      _sum: {
        agentsTotal: true,
        tokensTotal: true,
        currentStreakDays: true,
        longestStreakDays: true,
      },
    }),
  ])

  const computedAt = new Date()
  const stats: LeaderboardStats = {
    profileCount,
    sums: {
      agents: aggregates._sum.agentsTotal ?? 0,
      tokens: (aggregates._sum.tokensTotal ?? BigInt(0)).toString(),
      currentStreak: aggregates._sum.currentStreakDays ?? 0,
      longestStreak: aggregates._sum.longestStreakDays ?? 0,
    },
    computedAt,
  }

  await prisma.leaderboardStatsCache.upsert({
    where: { id: LEADERBOARD_STATS_CACHE_ID },
    create: {
      id: LEADERBOARD_STATS_CACHE_ID,
      profileCount: stats.profileCount,
      agentsSum: stats.sums.agents,
      tokensSum: BigInt(stats.sums.tokens),
      currentStreakSum: stats.sums.currentStreak,
      longestStreakSum: stats.sums.longestStreak,
      computedAt,
    },
    update: {
      profileCount: stats.profileCount,
      agentsSum: stats.sums.agents,
      tokensSum: BigInt(stats.sums.tokens),
      currentStreakSum: stats.sums.currentStreak,
      longestStreakSum: stats.sums.longestStreak,
      computedAt,
    },
  })

  return stats
}

export async function getLeaderboardStats(): Promise<LeaderboardStats> {
  const cached = await prisma.leaderboardStatsCache.findUnique({
    where: { id: LEADERBOARD_STATS_CACHE_ID },
  })

  if (cached && isLeaderboardStatsCacheFresh(cached.computedAt)) {
    return statsFromCacheRow(cached)
  }

  return recomputeLeaderboardStats()
}
