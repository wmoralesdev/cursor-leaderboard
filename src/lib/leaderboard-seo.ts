import { createLoader  } from "nuqs/server"
import type {LoaderInput} from "nuqs/server";
import { countryByCode } from "@/lib/countries"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"
import {
  leaderboardSearchParams,
  toLeaderboardSeoSearch
  
} from "@/lib/leaderboard-search-params"
import type {LeaderboardSeoSearch} from "@/lib/leaderboard-search-params";

const loadLeaderboardSearch = createLoader(leaderboardSearchParams)

export type { LeaderboardSeoSearch }

export function parseLeaderboardSearch(
  search: Record<string, unknown>,
): LeaderboardSeoSearch {
  return toLeaderboardSeoSearch(
    loadLeaderboardSearch(search as LoaderInput),
  )
}

export function leaderboardCanonicalPath(search: LeaderboardSeoSearch): string {
  const params = new URLSearchParams()
  if (search.country) {
    params.set("country", search.country)
  }
  if (search.metric !== "agents") {
    params.set("metric", search.metric)
  }
  const query = params.toString()
  return query ? `/?${query}` : "/"
}

export function buildLeaderboardHead(search: LeaderboardSeoSearch) {
  const country = search.country ? countryByCode(search.country) : null
  const isPaginated = search.page > 1
  const hasSortOrPageSize =
    search.order !== "desc" || search.limit !== 100

  const pageTitle = country
    ? `${country.name} leaderboard`
    : SITE.name

  const description = country
    ? `See who leads ${country.name} on the Cursor Leaderboard — ranked by public profile agents, tokens, and streaks.`
    : "See who leads globally on the Cursor Leaderboard — ranked by public profile agents, tokens, and streaks."

  const robots =
    isPaginated || hasSortOrPageSize ? "noindex,follow" : "index,follow"

  const path = isPaginated
    ? leaderboardCanonicalPath({ ...search, page: 1 })
    : leaderboardCanonicalPath(search)

  const origin = getSiteOrigin()

  return buildPageHead({
    title: pageTitle,
    description,
    path,
    robots,
    jsonLd: [
      websiteJsonLd(origin),
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: formatTitle(pageTitle),
        description,
        url: absoluteUrl(path),
        isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
      },
    ],
  })
}
