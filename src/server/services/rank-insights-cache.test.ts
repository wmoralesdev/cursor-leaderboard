import { describe, expect, it } from "vitest"
import {
  isCountryDetailCacheFresh,
  serializeCountryDetail,
} from "@/server/services/country-detail-cache-service"
import {
  isModelStatsCacheFresh,
  serializeModelStats,
} from "@/server/services/model-stats-cache-service"

describe("country detail cache serialization", () => {
  it("serializes computedAt to ISO string", () => {
    const computedAt = new Date("2026-06-07T00:00:00.000Z")
    const dto = serializeCountryDetail({
      country: "SV",
      profileCount: 12,
      globalRank: 3,
      topModel: "Composer",
      avgAgentsTotal: 420.5,
      avgCloudShare: 0.12,
      maxLongestStreak: 37,
      topBuilders: [],
      computedAt,
    })

    expect(dto.computedAt).toBe(computedAt.toISOString())
    expect(dto.country).toBe("SV")
  })

  it("treats cache younger than TTL as fresh", () => {
    const now = new Date("2026-06-07T12:00:00.000Z")
    const computedAt = new Date("2026-06-07T00:00:00.000Z")
    expect(isCountryDetailCacheFresh(computedAt, now)).toBe(true)
  })
})

describe("model stats cache serialization", () => {
  it("serializes model stats payload", () => {
    const computedAt = new Date("2026-06-07T00:00:00.000Z")
    const dto = serializeModelStats({
      model: "Composer 2.5",
      profileCount: 88,
      topCountries: [{ country: "US", profileCount: 40 }],
      topBuilders: [],
      avgAgentsTotal: 900,
      avgCurrentStreak: 12,
      computedAt,
    })

    expect(dto.model).toBe("Composer 2.5")
    expect(dto.topCountries[0]?.country).toBe("US")
  })

  it("treats cache younger than TTL as fresh", () => {
    const now = new Date("2026-06-07T12:00:00.000Z")
    const computedAt = new Date("2026-06-07T00:00:00.000Z")
    expect(isModelStatsCacheFresh(computedAt, now)).toBe(true)
  })
})
