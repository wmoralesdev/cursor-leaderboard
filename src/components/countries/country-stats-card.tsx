import { ArrowRight } from "lucide-react"
import { Link } from "@tanstack/react-router"

import type { CountryStatsItemDto, EntryDto, MetricKey, SortOrder } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import { METRICS, formatInt, formatMetricValue } from "@/lib/format"
import { rankBadgeClasses } from "@/lib/rank-classes"
import { cn } from "@/lib/utils"

type CountryStatsCardProps = {
  countryCode: string
  stats: CountryStatsItemDto
  topMetric: MetricKey
  order: SortOrder
}

function topEntryDto(
  top: CountryStatsItemDto["topThree"][number],
  country: string,
): EntryDto {
  return {
    id: top.handle,
    handle: top.handle,
    country,
    displayName: top.displayName,
    profileUrl: "",
    isAmbassador: false,
    joinedDaysAgo: null,
    agentsTotal: top.agentsTotal,
    agentsLocal: 0,
    agentsCloud: 0,
    currentStreakDays: top.currentStreakDays,
    longestStreakDays: top.longestStreakDays,
    longestAgentHours: 0,
    tokensTotal: top.tokensTotal,
    topModels: [],
    scrapeStatus: "ok",
    scrapeError: null,
    scrapedAt: null,
    createdAt: "",
    updatedAt: "",
    rank: top.rank,
  }
}

function CountryStatsCard({
  countryCode,
  stats,
  topMetric,
  order,
}: CountryStatsCardProps) {
  const meta = countryByCode(countryCode)
  const countryName = meta?.name ?? countryCode
  const MetricIcon = METRICS.find((m) => m.key === topMetric)?.icon
  const isTopCountry = stats.globalRank === 1

  return (
    <Link
      to="/"
      search={{
        country: countryCode,
        metric: topMetric,
        order,
        page: 1,
        limit: 100,
      }}
      aria-label={`Open ${countryName} leaderboard`}
      className="group bg-card border-border/60 hover:border-border flex flex-col rounded-xl border p-4 outline-none transition-colors hover:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-lg leading-none" aria-hidden>
            {meta?.flag ?? "🏳️"}
          </span>
          <span className="truncate text-sm font-semibold">{countryName}</span>
        </div>
        {stats.globalRank !== null && (
          <span
            className={cn(
              "shrink-0 rounded-md text-[0.6875rem] font-medium tabular-nums",
              isTopCountry
                ? "bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] text-brand px-1.5 py-0.5"
                : "text-muted-foreground"
            )}
          >
            #{stats.globalRank} global
          </span>
        )}
      </div>

      <p className="text-muted-foreground mt-1 text-xs">
        {formatInt(stats.profileCount)}{" "}
        {stats.profileCount === 1 ? "profile" : "profiles"}
      </p>

      {stats.topThree.length > 0 ? (
        <ul className="divide-border/50 border-border/50 mt-3 flex flex-col divide-y border-t">
          {stats.topThree.map((top) => {
            const entry = topEntryDto(top, countryCode)
            const value = formatMetricValue(topMetric, entry)
            return (
              <li
                key={top.handle}
                className="flex items-center gap-2.5 py-2 text-xs"
              >
                <span className={rankBadgeClasses(top.rank)}>{top.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium leading-tight">
                    {top.displayName || top.handle}
                  </p>
                  <p className="text-muted-foreground truncate leading-tight">
                    @{top.handle}
                  </p>
                </div>
                <span
                  className="text-foreground flex shrink-0 items-center gap-1.5 font-medium tabular-nums"
                  title={value}
                >
                  {MetricIcon && (
                    <MetricIcon
                      aria-hidden
                      className="text-muted-foreground size-3.5 opacity-60"
                    />
                  )}
                  {value}
                </span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground border-border/50 mt-3 border-t pt-3 text-xs">
          No profiles yet
        </p>
      )}

      <span className="text-muted-foreground/60 group-hover:text-foreground mt-3 inline-flex items-center gap-1 text-[0.6875rem] font-medium transition-colors">
        View {countryName} board
        <ArrowRight
          aria-hidden
          className="size-3 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  )
}

export { CountryStatsCard }
