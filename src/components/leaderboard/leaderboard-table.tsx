import { ArrowUpRight } from "lucide-react"

import { buildRowContextItems } from "@/lib/entry-insights"
import type { EntryDto, MetricKey } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import type { MetricMeta } from "@/lib/format"
import { METRICS, formatMetricValue, metricUnitLabel } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { rankBadgeClasses } from "@/lib/rank-classes"
import { cn } from "@/lib/utils"

type LeaderboardTableProps = {
  entries: EntryDto[]
  metric: MetricKey
  emptyAction?: React.ReactNode
}

function secondaryMetrics(active: MetricKey): MetricMeta[] {
  return METRICS.filter((m) => m.key !== active)
}

function SecondaryStat({ meta, entry }: { meta: MetricMeta; entry: EntryDto }) {
  const Icon = meta.icon
  const value = formatMetricValue(meta.key, entry)

  if (meta.key === "joined" && entry.joinedDaysAgo === null) {
    return null
  }

  return (
    <div
      className="text-muted-foreground flex items-center gap-1"
      title={`${meta.label}: ${value}`}
    >
      <Icon aria-hidden className="size-3 shrink-0 opacity-60" />
      <span className="text-[0.6875rem] leading-none tabular-nums">{value}</span>
      <span className="sr-only">{meta.label}</span>
    </div>
  )
}

function PrimaryMetric({
  metric,
  entry,
}: {
  metric: MetricKey
  entry: EntryDto
}) {
  const meta = METRICS.find((m) => m.key === metric)!
  const value = formatMetricValue(metric, entry)
  const unit = metricUnitLabel(metric)

  return (
    <div
      className="flex shrink-0 flex-col items-end gap-0.5"
      aria-label={`${meta.label}: ${value} ${unit}`}
    >
      <span className="text-foreground text-base font-semibold leading-none tabular-nums">
        {value}
      </span>
      <span className="text-muted-foreground text-[0.6875rem] leading-tight">
        {unit}
      </span>
    </div>
  )
}

function ProfileIdentity({ entry }: { entry: EntryDto }) {
  const country = countryByCode(entry.country)

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-sm font-medium">
          {entry.displayName || entry.handle}
        </span>
        {country && (
          <span
            aria-hidden
            className="shrink-0 text-sm leading-none"
            title={country.name}
          >
            {country.flag}
          </span>
        )}
        {entry.isAmbassador && (
          <span className="text-muted-foreground hidden shrink-0 text-[0.6875rem] sm:inline">
            Ambassador
          </span>
        )}
      </div>
      <p className="text-muted-foreground mt-0.5 truncate text-xs">
        @{entry.handle}
      </p>
    </div>
  )
}

function RowMetadata({
  entry,
  metric,
}: {
  entry: EntryDto
  metric: MetricKey
}) {
  const modelLine = entry.topModels.join(" / ")
  const contextItems = buildRowContextItems(metric, entry)

  if (!modelLine && contextItems.length === 0) return null

  return (
    <div className="mt-1.5 flex min-w-0 flex-col gap-0.5">
      {modelLine ? (
        <p
          className="text-muted-foreground truncate text-[0.6875rem] leading-snug"
          title={modelLine}
        >
          {modelLine}
        </p>
      ) : null}
      {contextItems.length > 0 ? (
        <p className="text-muted-foreground/80 truncate text-[0.6875rem] leading-snug">
          {contextItems.join(" · ")}
        </p>
      ) : null}
    </div>
  )
}

function MetricRail({
  metric,
  entry,
  compact = false,
}: {
  metric: MetricKey
  entry: EntryDto
  compact?: boolean
}) {
  const stats = secondaryMetrics(metric)

  return (
    <div className="flex flex-col items-end gap-1.5">
      <PrimaryMetric metric={metric} entry={entry} />
      <div
        className={cn(
          "flex flex-wrap justify-end gap-x-3 gap-y-1",
          compact && "max-w-[9.5rem]",
        )}
      >
        {(compact ? stats.slice(0, 2) : stats).map((meta) => (
          <SecondaryStat key={meta.key} meta={meta} entry={entry} />
        ))}
      </div>
    </div>
  )
}

function LeaderboardTable({
  entries,
  metric,
  emptyAction,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <Card className="items-center gap-3 px-6 py-14 text-center">
        <p className="text-sm font-medium">No entries yet</p>
        <p className="text-muted-foreground max-w-xs text-xs">
          Be the first to climb the board — paste your Cursor profile and pick
          your country.
        </p>
        {emptyAction}
      </Card>
    )
  }

  return (
    <div className="divide-border/60 border-border/60 -mx-2.5 divide-y border-y sm:-mx-3">
      {entries.map((entry) => {
        const rank = entry.rank ?? 0
        return (
          <a
            key={entry.id}
            href={entry.profileUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group flex flex-col gap-2 px-2.5 py-3.5 transition-colors",
              "hover:bg-muted/30",
              "sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:px-3 sm:py-3",
            )}
          >
            <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
              <span className={rankBadgeClasses(rank)}>{rank}</span>

              <div className="min-w-0 flex-1">
                <ProfileIdentity entry={entry} />
                <RowMetadata entry={entry} metric={metric} />
              </div>

              <div className="shrink-0 sm:hidden">
                <PrimaryMetric metric={metric} entry={entry} />
              </div>
            </div>

            <div className="flex items-center gap-3 pl-10 sm:hidden">
              {secondaryMetrics(metric).map((meta) => (
                <SecondaryStat key={meta.key} meta={meta} entry={entry} />
              ))}
            </div>

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <MetricRail metric={metric} entry={entry} compact />
              <ArrowUpRight
                aria-hidden
                className="text-muted-foreground/0 group-hover:text-muted-foreground size-3.5 shrink-0 transition-colors"
              />
            </div>
          </a>
        )
      })}
    </div>
  )
}

export { LeaderboardTable }
