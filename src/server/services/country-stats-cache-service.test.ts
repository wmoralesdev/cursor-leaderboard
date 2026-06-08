import { describe, expect, it } from "vitest"

import {
  COUNTRY_STATS_CACHE_TTL_MS,
  isCountryStatsCacheFresh,
  serializeCountryStatsHeader,
} from "@/server/services/country-stats-cache-service"

describe("isCountryStatsCacheFresh", () => {
  const now = new Date("2026-06-07T12:00:00.000Z")

  it("treats cache younger than 24h as fresh", () => {
    const computedAt = new Date(
      now.getTime() - COUNTRY_STATS_CACHE_TTL_MS + 60_000,
    )
    expect(isCountryStatsCacheFresh(computedAt, now)).toBe(true)
  })

  it("treats cache older than 24h as stale", () => {
    const computedAt = new Date(
      now.getTime() - COUNTRY_STATS_CACHE_TTL_MS - 1,
    )
    expect(isCountryStatsCacheFresh(computedAt, now)).toBe(false)
  })

  it("treats cache exactly at 24h boundary as stale", () => {
    const computedAt = new Date(now.getTime() - COUNTRY_STATS_CACHE_TTL_MS)
    expect(isCountryStatsCacheFresh(computedAt, now)).toBe(false)
  })
})

describe("serializeCountryStatsHeader", () => {
  it("serializes country count and single top model", () => {
    const dto = serializeCountryStatsHeader({
      countryCount: 49,
      topModel: "Composer 2.5",
      computedAt: new Date("2026-06-07T12:00:00.000Z"),
    })

    expect(dto).toEqual({
      countryCount: 49,
      topModel: "Composer 2.5",
      computedAt: "2026-06-07T12:00:00.000Z",
    })
  })

  it("preserves a null top model", () => {
    const dto = serializeCountryStatsHeader({
      countryCount: 0,
      topModel: null,
      computedAt: new Date("2026-06-07T12:00:00.000Z"),
    })

    expect(dto.topModel).toBeNull()
  })
})
