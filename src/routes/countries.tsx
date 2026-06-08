import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { CountryStatsCard } from "@/components/countries/country-stats-card"
import { CountryHeaderStats } from "@/components/countries/country-header-stats"
import { CountryStatsToolbar } from "@/components/countries/country-stats-toolbar"
import { AppNavbar } from "@/components/layout/app-navbar"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import type { SortOrder } from "@/lib/api"
import { getCountryStats } from "@/lib/api"
import type { CountryRankBy } from "@/lib/country-rank"
import { parseCountriesSearch } from "@/lib/countries-search"
import type {CountriesSearch} from "@/lib/countries-search";
import { METRICS, countryRankDescription } from "@/lib/format"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"

export const Route = createFileRoute("/countries")({
  validateSearch: parseCountriesSearch,
  head: () => {
    const origin = getSiteOrigin()
    const description =
      "Browse Cursor Leaderboard stats by country: profile counts, top builders, and links to each national board."
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
  loaderDeps: ({ search }) => parseCountriesSearch(search as Record<string, unknown>),
  loader: ({ deps }) =>
    getCountryStats({ data: { rankBy: deps.rankBy, order: deps.order } }),
  component: CountriesPage,
})

function CountriesPage() {
  const { rankBy, order } = Route.useSearch()
  const data = Route.useLoaderData()
  const navigate = useNavigate({ from: Route.fullPath })
  const countriesWithData = data.countries
  const activeCount = countriesWithData.length
  const topMetricLabel =
    METRICS.find((m) => m.key === data.topMetric)?.label ?? "Agents"

  function setRankBy(next: CountryRankBy) {
    navigate({ search: (prev: CountriesSearch) => ({ ...prev, rankBy: next }) })
  }

  function setOrder(next: SortOrder) {
    navigate({ search: (prev: CountriesSearch) => ({ ...prev, order: next }) })
  }

  return (
    <div className="min-h-svh">
      <AppNavbar />

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Country stats
            </h1>
            <p className="text-muted-foreground max-w-[68ch] text-[13px]">
              {countryRankDescription(rankBy)} Top three per country by{" "}
              {topMetricLabel.toLowerCase()}.
            </p>
          </div>
          {activeCount > 0 ? (
            <CountryHeaderStats
              header={data.header}
              className="shrink-0 self-start"
            />
          ) : null}
        </header>

        <CountryStatsToolbar
          rankBy={rankBy}
          order={order}
          onRankByChange={setRankBy}
          onOrderChange={setOrder}
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {countriesWithData.map((stats) => (
              <CountryStatsCard
                key={stats.country}
                countryCode={stats.country}
                stats={stats}
                topMetric={data.topMetric}
                order={order}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
