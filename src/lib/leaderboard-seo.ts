import type { LeaderboardPageSize, MetricKey, SortOrder } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"

const METRIC_KEYS: MetricKey[] = [
  "agents",
  "tokens",
  "currentStreak",
  "longestStreak",
]

const SORT_ORDERS: SortOrder[] = ["asc", "desc"]
const PAGE_SIZES: LeaderboardPageSize[] = [25, 50, 100]

function parsePageSize(raw: unknown): LeaderboardPageSize {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw)
  return PAGE_SIZES.includes(n as LeaderboardPageSize)
    ? (n as LeaderboardPageSize)
    : 100
}

function parsePage(raw: unknown): number {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
}

export function parseLeaderboardSearch(
  search: Record<string, unknown>,
): LeaderboardSeoSearch {
  const metric = METRIC_KEYS.includes(search.metric as MetricKey)
    ? (search.metric as MetricKey)
    : "agents"

  const countryRaw =
    typeof search.country === "string" ? search.country.toUpperCase() : undefined
  const country =
    countryRaw && /^[A-Z]{2}$/.test(countryRaw) ? countryRaw : undefined

  const orderRaw =
    typeof search.order === "string" ? search.order.toLowerCase() : undefined
  const order = SORT_ORDERS.includes(orderRaw as SortOrder)
    ? (orderRaw as SortOrder)
    : "desc"

  const page = parsePage(search.page)
  const limit = parsePageSize(search.limit)

  const base = { metric, order, page, limit }
  return country ? { ...base, country } : base
}

export type LeaderboardSeoSearch = {
  metric: MetricKey
  order: SortOrder
  country?: string
  page: number
  limit: LeaderboardPageSize
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
