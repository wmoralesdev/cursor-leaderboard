import { describe, expect, it } from "vitest"

import type { LeaderboardEntry } from "@/generated/prisma/client"
import { buildCountryStatsDto } from "@/server/lib/serialize-country-stats"

function mockEntry(
  overrides: Partial<LeaderboardEntry> & Pick<LeaderboardEntry, "country" | "handle">,
): LeaderboardEntry {
  return {
    id: overrides.handle,
    displayName: null,
    profileUrl: "",
    isAmbassador: false,
    joinedDaysAgo: null,
    agentsTotal: 0,
    agentsLocal: 0,
    agentsCloud: 0,
    currentStreakDays: 0,
    longestStreakDays: 0,
    longestAgentHours: 0,
    tokensTotal: BigInt(0),
    topModels: [],
    scrapeStatus: "ok",
    scrapeError: null,
    scrapedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

const headerCache = {
  countryCount: 2,
  topModel: "Composer 2.5",
  computedAt: new Date("2026-06-07T12:00:00.000Z"),
}

describe("buildCountryStatsDto", () => {
  it("maps topModelByCountry onto each country", () => {
    const usEntry = mockEntry({
      country: "US",
      handle: "alpha",
      agentsTotal: 100,
    })
    const svEntry = mockEntry({
      country: "SV",
      handle: "beta",
      agentsTotal: 50,
    })

    const dto = buildCountryStatsDto({
      rankBy: "profiles",
      order: "desc",
      aggregates: [
        { country: "US", profileCount: 2 },
        { country: "SV", profileCount: 1 },
      ],
      topByCountry: new Map([
        ["US", [usEntry]],
        ["SV", [svEntry]],
      ]),
      topModelByCountry: new Map([
        ["US", "Composer 2.5"],
        ["SV", "Claude 4 Sonnet"],
      ]),
      headerCache,
    })

    expect(dto.countries).toHaveLength(2)
    expect(dto.countries[0]).toMatchObject({
      country: "US",
      topModel: "Composer 2.5",
    })
    expect(dto.countries[1]).toMatchObject({
      country: "SV",
      topModel: "Claude 4 Sonnet",
    })
  })

  it("sets topModel to null when country is missing from topModelByCountry", () => {
    const entry = mockEntry({ country: "IN", handle: "gamma", agentsTotal: 10 })

    const dto = buildCountryStatsDto({
      rankBy: "profiles",
      order: "desc",
      aggregates: [{ country: "IN", profileCount: 1 }],
      topByCountry: new Map([["IN", [entry]]]),
      topModelByCountry: new Map(),
      headerCache: {
        countryCount: 1,
        topModel: null,
        computedAt: new Date("2026-06-07T12:00:00.000Z"),
      },
    })

    expect(dto.countries[0]?.topModel).toBeNull()
  })

  it("builds header from cache with country count and top model", () => {
    const dto = buildCountryStatsDto({
      rankBy: "profiles",
      order: "desc",
      aggregates: [
        { country: "US", profileCount: 2 },
        { country: "SV", profileCount: 1 },
      ],
      topByCountry: new Map(),
      topModelByCountry: new Map(),
      headerCache,
    })

    expect(dto.header).toEqual({
      countryCount: 2,
      topModel: "Composer 2.5",
    })
  })

  it("omits top model chip when header topModel is null", () => {
    const dto = buildCountryStatsDto({
      rankBy: "agents",
      order: "desc",
      aggregates: [
        { country: "US", profileCount: 2, metricTotal: 100 },
        { country: "SV", profileCount: 1, metricTotal: 50 },
      ],
      topByCountry: new Map(),
      topModelByCountry: new Map(),
      headerCache: {
        countryCount: 2,
        topModel: null,
        computedAt: new Date("2026-06-07T12:00:00.000Z"),
      },
    })

    expect(dto.header).toEqual({
      countryCount: 2,
      topModel: null,
    })
  })
})
