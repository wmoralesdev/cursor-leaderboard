import { describe, expect, it } from "vitest"

import {
  isLeaderboardStatsCacheFresh,
  LEADERBOARD_STATS_CACHE_TTL_MS,
} from "@/server/services/leaderboard-stats-service"

describe("isLeaderboardStatsCacheFresh", () => {
  const now = new Date("2026-06-07T12:00:00.000Z")

  it("treats cache younger than 24h as fresh", () => {
    const computedAt = new Date(
      now.getTime() - LEADERBOARD_STATS_CACHE_TTL_MS + 60_000,
    )
    expect(isLeaderboardStatsCacheFresh(computedAt, now)).toBe(true)
  })

  it("treats cache older than 24h as stale", () => {
    const computedAt = new Date(
      now.getTime() - LEADERBOARD_STATS_CACHE_TTL_MS - 1,
    )
    expect(isLeaderboardStatsCacheFresh(computedAt, now)).toBe(false)
  })

  it("treats cache exactly at 24h boundary as stale", () => {
    const computedAt = new Date(now.getTime() - LEADERBOARD_STATS_CACHE_TTL_MS)
    expect(isLeaderboardStatsCacheFresh(computedAt, now)).toBe(false)
  })
})
