import { createFileRoute, Link } from "@tanstack/react-router"

import { AppNavbar } from "@/components/layout/app-navbar"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { getModelStats } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import { formatAgents, formatInt } from "@/lib/format"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"
import { rankBadgeClasses } from "@/lib/rank-classes"

export const Route = createFileRoute("/models/$model")({
  loader: ({ params }) =>
    getModelStats({ data: { model: decodeURIComponent(params.model) } }),
  head: ({ loaderData, params }) => {
    const modelName = decodeURIComponent(params.model)
    const origin = getSiteOrigin()
    const description = loaderData
      ? `${modelName} on the Cursor Leaderboard — ${loaderData.profileCount} profiles across ${loaderData.topCountries.length} countries.`
      : `Cursor Leaderboard stats for ${modelName}.`
    const path = `/models/${encodeURIComponent(modelName)}`

    return buildPageHead({
      title: `${modelName} stats`,
      description,
      path,
      jsonLd: [
        websiteJsonLd(origin),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: formatTitle(`${modelName} stats`),
          description,
          url: absoluteUrl(path),
          isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
        },
      ],
    })
  },
  component: ModelDetailPage,
})

function ModelDetailPage() {
  const stats = Route.useLoaderData()

  return (
    <div className="min-h-svh">
      <AppNavbar />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-2">
          <Link
            to="/models"
            className="text-muted-foreground hover:text-foreground w-fit text-xs transition-colors"
          >
            ← All models
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{stats.model}</h1>
          <p className="text-muted-foreground text-sm">
            Builders on the board who lead with this model.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatBlock label="Profiles" value={formatInt(stats.profileCount)} />
          <StatBlock
            label="Avg agents"
            value={formatAgents(Math.round(stats.avgAgentsTotal))}
          />
          <StatBlock
            label="Avg current streak"
            value={`${Math.round(stats.avgCurrentStreak)}d`}
          />
          <StatBlock
            label="Top countries"
            value={String(stats.topCountries.length)}
          />
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Top countries</h2>
            <Link
              to="/"
              search={{
                metric: "agents",
                order: "desc",
                page: 1,
                limit: 100,
                models: [stats.model],
              }}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Filter board →
            </Link>
          </div>
          <ul className="divide-border/60 border-border/60 divide-y border-y">
            {stats.topCountries.map((row, index) => {
              const country = countryByCode(row.country)
              return (
                <li
                  key={row.country}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className={rankBadgeClasses(index + 1)}>{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {country?.flag ?? "🏳️"} {country?.name ?? row.country}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatInt(row.profileCount)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Top builders</h2>
          <ul className="divide-border/60 border-border/60 divide-y border-y">
            {stats.topBuilders.map((builder, index) => {
              const country = countryByCode(builder.country)
              return (
                <li
                  key={builder.handle}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className={rankBadgeClasses(index + 1)}>{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {builder.displayName || builder.handle}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      @{builder.handle}
                      {country ? ` · ${country.flag} ${country.name}` : ""}
                    </p>
                  </div>
                  <span className="tabular-nums">
                    {formatAgents(builder.agentsTotal)}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <div className="flex justify-center">
          <JoinDialog />
        </div>
      </main>
    </div>
  )
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border-border/60 rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
