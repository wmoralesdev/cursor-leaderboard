import { describe, expect, it } from "vitest"

import {
  buildEntryWhere,
  isEntryDueForRescrape,
  rankForLeaderboardPage,
} from "@/server/services/entries-service"

describe("rankForLeaderboardPage", () => {
  it("numbers desc rows from the top", () => {
    expect(
      rankForLeaderboardPage({
        order: "desc",
        total: 237,
        page: 1,
        limit: 100,
        index: 0,
      }),
    ).toBe(1)
    expect(
      rankForLeaderboardPage({
        order: "desc",
        total: 237,
        page: 2,
        limit: 100,
        index: 0,
      }),
    ).toBe(101)
  })

  it("numbers asc rows from the bottom", () => {
    expect(
      rankForLeaderboardPage({
        order: "asc",
        total: 237,
        page: 1,
        limit: 100,
        index: 0,
      }),
    ).toBe(237)
    expect(
      rankForLeaderboardPage({
        order: "asc",
        total: 237,
        page: 1,
        limit: 100,
        index: 99,
      }),
    ).toBe(138)
    expect(
      rankForLeaderboardPage({
        order: "asc",
        total: 237,
        page: 2,
        limit: 100,
        index: 0,
      }),
    ).toBe(137)
  })
})

describe("buildEntryWhere", () => {
  it("scopes to ok scrapes only", () => {
    expect(buildEntryWhere({})).toEqual({ scrapeStatus: "ok" })
  })

  it("adds country filter", () => {
    expect(buildEntryWhere({ country: "US" })).toEqual({
      scrapeStatus: "ok",
      country: "US",
    })
  })

  it("adds OR filter for multiple models", () => {
    expect(
      buildEntryWhere({ models: ["Composer 2.5", "Composer 2"] }),
    ).toEqual({
      scrapeStatus: "ok",
      OR: [
        { topModels: { array_contains: "Composer 2.5" } },
        { topModels: { array_contains: "Composer 2" } },
      ],
    })
  })

  it("combines country and model filters", () => {
    expect(buildEntryWhere({ country: "PH", models: ["Composer 2.5"] })).toEqual({
      scrapeStatus: "ok",
      country: "PH",
      OR: [{ topModels: { array_contains: "Composer 2.5" } }],
    })
  })

  it("ignores empty model list", () => {
    expect(buildEntryWhere({ models: [] })).toEqual({ scrapeStatus: "ok" })
  })
})

describe("isEntryDueForRescrape", () => {
  const now = new Date("2026-06-05T12:00:00.000Z")
  const dayMs = 24 * 60 * 60 * 1000
  const hourMs = 60 * 60 * 1000

  it("treats missing scrapedAt as due", () => {
    expect(
      isEntryDueForRescrape(
        { scrapedAt: null, scrapeStatus: "ok" },
        { now, maxAgeMs: dayMs, errorRetryMs: hourMs },
      ),
    ).toBe(true)
  })

  it("treats ok rows younger than max age as fresh", () => {
    expect(
      isEntryDueForRescrape(
        {
          scrapedAt: new Date(now.getTime() - dayMs + hourMs),
          scrapeStatus: "ok",
        },
        { now, maxAgeMs: dayMs, errorRetryMs: hourMs },
      ),
    ).toBe(false)
  })

  it("treats ok rows older than max age as due", () => {
    expect(
      isEntryDueForRescrape(
        {
          scrapedAt: new Date(now.getTime() - dayMs - 1),
          scrapeStatus: "ok",
        },
        { now, maxAgeMs: dayMs, errorRetryMs: hourMs },
      ),
    ).toBe(true)
  })

  it("retries parse_error rows sooner than ok rows", () => {
    const scrapedAt = new Date(now.getTime() - 2 * hourMs)

    expect(
      isEntryDueForRescrape(
        { scrapedAt, scrapeStatus: "parse_error" },
        { now, maxAgeMs: dayMs, errorRetryMs: hourMs },
      ),
    ).toBe(true)

    expect(
      isEntryDueForRescrape(
        { scrapedAt, scrapeStatus: "ok" },
        { now, maxAgeMs: dayMs, errorRetryMs: hourMs },
      ),
    ).toBe(false)
  })
})
