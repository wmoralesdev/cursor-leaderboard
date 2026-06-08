import { createFileRoute, Link } from "@tanstack/react-router"

import { AppNavbar } from "@/components/layout/app-navbar"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { getCountryDetail } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"
import { formatAgents, formatInt } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { rankBadgeClasses } from "@/lib/rank-classes"

export const Route = createFileRoute("/countries/$code")({
  loader: ({ params }) => getCountryDetail({ data: { code: params.code } }),
  head: ({ loaderData, params }) => {
    const country = countryByCode(params.code.toUpperCase())
    const name = country?.name ?? params.code.toUpperCase()
    const origin = getSiteOrigin()
    const description = loaderData
      ? `${name} on the Cursor Leaderboard — ${loaderData.profileCount} profiles, top model ${loaderData.topModel ?? "n/a"}.`
      : `Cursor Leaderboard stats for ${name}.`
    const path = `/countries/${params.code.toUpperCase()}`

    return buildPageHead({
      title: `${name} stats`,
      description,
      path,
      jsonLd: [
        websiteJsonLd(origin),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: formatTitle(`${name} stats`),
          description,
          url: absoluteUrl(path),
          isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
        },
      ],
    })
  },
  component: CountryDetailPage,
})

function CountryDetailPage() {
  const detail = Route.useLoaderData()
  const country = countryByCode(detail.country)
  const countryName = country?.name ?? detail.country
  const cloudPct = Math.round(detail.avgCloudShare * 100)

  return (
    <div className="min-h-svh">
      <AppNavbar />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-2">
          <Link
            to="/countries"
            search={{ rankBy: "profiles", order: "desc" }}
            className="text-muted-foreground hover:text-foreground w-fit text-xs transition-colors"
          >
            ← All countries
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            {country?.flag ?? "🏳️"} {countryName}
          </h1>
          <p className="text-muted-foreground text-sm">
            What the Cursor builder scene looks like in {countryName}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatBlock label="Profiles" value={formatInt(detail.profileCount)} />
          <StatBlock
            label="Global rank"
            value={detail.globalRank ? `#${detail.globalRank}` : "—"}
          />
          <StatBlock
            label="Avg agents"
            value={formatAgents(Math.round(detail.avgAgentsTotal))}
          />
          <StatBlock label="Avg cloud share" value={`${cloudPct}%`} />
          <StatBlock
            label="Longest streak"
            value={`${detail.maxLongestStreak}d`}
          />
          <StatBlock
            label="Top model"
            value={detail.topModel ?? "—"}
            compact={Boolean(detail.topModel)}
          />
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">Top builders</h2>
            <Link
              to="/"
              search={{
                country: detail.country,
                metric: "agents",
                order: "desc",
                page: 1,
                limit: 100,
              }}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              View full board →
            </Link>
          </div>

          {detail.topBuilders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No profiles yet.</p>
          ) : (
            <ul className="divide-border/60 border-border/60 divide-y border-y">
              {detail.topBuilders.map((builder, index) => (
                <li
                  key={builder.handle}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <span className={rankBadgeClasses(index + 1)}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {builder.displayName || builder.handle}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      @{builder.handle}
                    </p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {formatAgents(builder.agentsTotal)} agents
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-center">
          <JoinDialog />
        </div>
      </main>
    </div>
  )
}

function StatBlock({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div className="bg-card border-border/60 rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p
        className={
          compact
            ? "mt-1 truncate text-sm font-semibold"
            : "mt-1 text-lg font-semibold tabular-nums"
        }
        title={compact ? value : undefined}
      >
        {value}
      </p>
    </div>
  )
}
