import { Link } from "@tanstack/react-router"

import type { CountryStatsItemDto, EntryDto, MetricKey } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import { formatInt, formatMetricValue } from "@/lib/format"
import { rankBadgeClasses } from "@/lib/rank-classes"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type CountryStatsCardProps = {
  countryCode: string
  stats: CountryStatsItemDto
  metric: MetricKey
}

function initialFor(name: string | null, handle: string): string {
  const source = name?.trim() || handle
  return source.charAt(0).toUpperCase()
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

function CountryStatsCard({ countryCode, stats, metric }: CountryStatsCardProps) {
  const meta = countryByCode(countryCode)

  const inner = (
    <Card className="shadow-none transition-colors hover:border-border">
      <CardHeader className="gap-2 pb-0">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
            <span className="shrink-0 text-base" aria-hidden>
              {meta?.flag ?? "🏳️"}
            </span>
            <span className="truncate">{meta?.name ?? countryCode}</span>
          </CardTitle>
          {stats.globalRank !== null && (
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              #{stats.globalRank} global
            </span>
          )}
        </div>
        <CardDescription className="text-xs">
          {formatInt(stats.profileCount)}{" "}
          {stats.profileCount === 1 ? "profile" : "profiles"}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-3">
        {stats.topThree.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {stats.topThree.map((top) => {
              const entry = topEntryDto(top, countryCode)
              return (
                <li
                  key={top.handle}
                  className="flex items-center gap-2.5 text-xs"
                >
                  <span className={rankBadgeClasses(top.rank)}>
                    {top.rank}
                  </span>
                  <span
                    aria-hidden
                    className="bg-secondary text-secondary-foreground grid size-7 shrink-0 place-items-center rounded-full text-[0.625rem] font-medium"
                  >
                    {initialFor(top.displayName, top.handle)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">
                      {top.displayName || top.handle}
                    </p>
                    <p className="text-muted-foreground truncate leading-tight">
                      @{top.handle}
                    </p>
                  </div>
                  <span className="text-foreground shrink-0 tabular-nums font-medium">
                    {formatMetricValue(metric, entry)}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">—</p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <Link
      to="/"
      search={{ country: countryCode, metric, order: "desc", page: 1, limit: 100 }}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {inner}
    </Link>
  )
}

export { CountryStatsCard }
