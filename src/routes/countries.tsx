import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"

import { CountryStatsCard } from "@/components/countries/country-stats-card"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { MetricTabs } from "@/components/leaderboard/metric-tabs"
import type { MetricKey } from "@/lib/api"
import { getCountryStats } from "@/lib/api"
import { METRICS, metricCountryRankPhrase } from "@/lib/format"
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

type CountriesSearch = {
  metric: MetricKey
}

function leaderboardSearch(metric: MetricKey) {
  return { metric, order: "desc" as const, page: 1, limit: 100 as const }
}

export const Route = createFileRoute("/countries")({
  validateSearch: (search: Record<string, unknown>): CountriesSearch => {
    const metric = METRIC_KEYS.includes(search.metric as MetricKey)
      ? (search.metric as MetricKey)
      : "agents"
    return { metric }
  },
  head: () => {
    const origin = getSiteOrigin()
    const description =
      "Browse Cursor Leaderboard stats by country — profile counts, top builders, and links to each national board."
    return buildPageHead({
      title: "Country stats",
      description,
      path: "/countries",
      jsonLd: [
        websiteJsonLd(origin),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: formatTitle("Country stats"),
          description,
          url: absoluteUrl("/countries"),
          isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
        },
      ],
    })
  },
  loaderDeps: ({ search }) => ({ metric: search.metric }),
  loader: ({ deps }) => getCountryStats({ data: { metric: deps.metric } }),
  component: CountriesPage,
})

function CountriesPage() {
  const { metric } = Route.useSearch()
  const data = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const countriesWithData = data.countries
  const activeCount = countriesWithData.length
  const topMetricLabel =
    METRICS.find((m) => m.key === data.topMetric)?.label ?? "Agents"

  function setMetric(next: MetricKey) {
    navigate({ search: (prev) => ({ ...prev, metric: next }) })
  }

  return (
    <div className="min-h-svh">
      <header className="border-border/60 sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background/80 px-5 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-3 text-sm font-medium">
          <Link
            to="/"
            search={leaderboardSearch(metric)}
            className="flex min-w-0 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <img
              src="/CUBE_2D_DARK.png"
              alt="Cursor Leaderboard"
              width={24}
              height={24}
              className="size-4 shrink-0 object-contain"
            />
            <span className="truncate">Cursor Leaderboard</span>
          </Link>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            /
          </span>
          <span className="text-muted-foreground hidden truncate text-xs sm:inline">
            Countries
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            search={leaderboardSearch(metric)}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Leaderboard
          </Link>
          <JoinDialog />
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            Country stats
          </h1>
          <p className="text-muted-foreground text-sm">
            Per-country profiles, top 3 by {topMetricLabel.toLowerCase()}, and
            global country rank by {metricCountryRankPhrase(metric)}.
          </p>
        </div>

        <MetricTabs
          value={metric}
          onValueChange={setMetric}
          aria-label="Country stats metric"
        />

        {activeCount === 0 ? (
          <div className="border-border/60 flex flex-col items-center gap-3 rounded-xl border px-6 py-14 text-center">
            <p className="text-sm font-medium">No country data yet</p>
            <p className="text-muted-foreground max-w-sm text-xs">
              Once profiles join the leaderboard with a country set, their
              stats will show up here.
            </p>
            <JoinDialog />
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-xs">
              {activeCount} {activeCount === 1 ? "country" : "countries"} with
              profiles
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {countriesWithData.map((stats) => (
                <CountryStatsCard
                  key={stats.country}
                  countryCode={stats.country}
                  stats={stats}
                  metric={data.metric}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
