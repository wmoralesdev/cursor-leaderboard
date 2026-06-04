import type { LeaderboardEntry } from "@/generated/prisma/client"

export type EntryDto = {
  id: string
  handle: string
  country: string
  displayName: string | null
  profileUrl: string
  isAmbassador: boolean
  joinedDaysAgo: number | null
  agentsTotal: number
  agentsLocal: number
  agentsCloud: number
  currentStreakDays: number
  longestStreakDays: number
  longestAgentHours: number
  tokensTotal: string
  topModels: string[]
  scrapeStatus: string
  scrapeError: string | null
  scrapedAt: string | null
  createdAt: string
  updatedAt: string
  rank?: number
}

export function serializeEntry(
  entry: LeaderboardEntry,
  rank?: number,
): EntryDto {
  const topModels = Array.isArray(entry.topModels)
    ? (entry.topModels as string[])
    : []

  return {
    id: entry.id,
    handle: entry.handle,
    country: entry.country,
    displayName: entry.displayName,
    profileUrl: entry.profileUrl,
    isAmbassador: entry.isAmbassador,
    joinedDaysAgo: entry.joinedDaysAgo,
    agentsTotal: entry.agentsTotal,
    agentsLocal: entry.agentsLocal,
    agentsCloud: entry.agentsCloud,
    currentStreakDays: entry.currentStreakDays,
    longestStreakDays: entry.longestStreakDays,
    longestAgentHours: entry.longestAgentHours,
    tokensTotal: entry.tokensTotal.toString(),
    topModels,
    scrapeStatus: entry.scrapeStatus,
    scrapeError: entry.scrapeError,
    scrapedAt: entry.scrapedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    ...(rank !== undefined ? { rank } : {}),
  }
}
