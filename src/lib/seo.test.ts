import { describe, expect, it } from "vitest"

import {
  leaderboardCanonicalPath,
  parseLeaderboardSearch,
} from "@/lib/leaderboard-seo"
import { buildRobotsTxt, buildSitemapXml, formatTitle } from "@/lib/seo"

describe("formatTitle", () => {
  it("uses site name alone when title is the site name", () => {
    expect(formatTitle("Cursor Leaderboard")).toBe("Cursor Leaderboard")
  })

  it("suffixes other page titles", () => {
    expect(formatTitle("Country stats")).toBe(
      "Country stats · Cursor Leaderboard",
    )
  })
})

describe("parseLeaderboardSearch", () => {
  it("normalizes invalid values to defaults", () => {
    expect(parseLeaderboardSearch({ page: "2", limit: "25" })).toEqual({
      metric: "agents",
      order: "desc",
      page: 2,
      limit: 25,
    })
  })

  it("omits models when empty", () => {
    expect(parseLeaderboardSearch({}).models).toBeUndefined()
  })

  it("parses joined metric and comma-separated model filters", () => {
    expect(
      parseLeaderboardSearch({
        metric: "joined",
        models: "Composer 2.5, Composer 2",
      }),
    ).toEqual({
      metric: "joined",
      order: "desc",
      models: ["Composer 2.5", "Composer 2"],
      page: 1,
      limit: 100,
    })
  })

  it("parses model filters from a parsed array (router-serialized)", () => {
    expect(
      parseLeaderboardSearch({ models: ["Composer 2.5", "GPT-5.5"] }).models,
    ).toEqual(["Composer 2.5", "GPT-5.5"])
  })
})

describe("leaderboardCanonicalPath", () => {
  it("drops pagination and non-canonical params", () => {
    expect(
      leaderboardCanonicalPath({
        metric: "agents",
        order: "desc",
        country: "SV",
        page: 3,
        limit: 25,
      }),
    ).toBe("/?country=SV")
  })

  it("keeps non-default metric in canonical", () => {
    expect(
      leaderboardCanonicalPath({
        metric: "tokens",
        order: "desc",
        page: 1,
        limit: 100,
      }),
    ).toBe("/?metric=tokens")
  })

  it("keeps model filters in canonical", () => {
    expect(
      leaderboardCanonicalPath({
        metric: "agents",
        order: "desc",
        models: ["Composer 2.5"],
        page: 1,
        limit: 100,
      }),
    ).toBe("/?models=Composer+2.5")
  })
})

describe("buildRobotsTxt", () => {
  it("includes sitemap and allow rules", () => {
    const text = buildRobotsTxt("https://leaderboard.example")
    expect(text).toContain("Sitemap: https://leaderboard.example/sitemap.xml")
    expect(text).toContain("Allow: /")
  })
})

describe("buildSitemapXml", () => {
  it("lists indexable routes", () => {
    const xml = buildSitemapXml("https://leaderboard.example")
    expect(xml).toContain("<loc>https://leaderboard.example/</loc>")
    expect(xml).toContain(
      "<loc>https://leaderboard.example/countries</loc>",
    )
  })
})
