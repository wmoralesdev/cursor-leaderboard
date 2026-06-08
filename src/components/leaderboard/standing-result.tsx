import {
  Activity,
  ArrowUpRight,
  Cloud,
  Coins,
  Globe,
  Laptop,
  MapPin,
  Target,
  TrendingUp,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { StandingCardDto } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import type { EntryInsightKind } from "@/lib/entry-insights"
import { METRICS, formatMetricValue, metricUnitLabel } from "@/lib/format"
import {
  formatCountryStandingLabel,
  formatGlobalStandingLabel,
  formatMilestoneLabel,
  formatMilestoneValue,
  formatStandingContextItems,
} from "@/lib/standing-format"
import { StatChip } from "@/components/ui/stat-chip"
import { rankBadgeClasses } from "@/lib/rank-classes"
import { cn } from "@/lib/utils"

type StandingResultProps = {
  standing: StandingCardDto
  className?: string
}

const STANDING_INSIGHT_ICONS: Record<EntryInsightKind, LucideIcon> = {
  agentsPerDay: Activity,
  localShare: Laptop,
  cloudShare: Cloud,
  tokensPerAgent: Coins,
  streakNearBest: TrendingUp,
}

function isEntryInsightKind(kind: string): kind is EntryInsightKind {
  return kind in STANDING_INSIGHT_ICONS
}

function standingInsightIcon(kind: string): LucideIcon {
  return isEntryInsightKind(kind) ? STANDING_INSIGHT_ICONS[kind] : Activity
}

function ProfileLink({ href, className }: { href: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1 text-xs transition-colors",
        className,
      )}
    >
      Cursor profile
      <ArrowUpRight aria-hidden className="size-3" />
    </a>
  )
}

function MetricSummary({
  icon: Icon,
  label,
  value,
  unit,
  className,
}: {
  icon?: LucideIcon
  label: string
  value: string
  unit: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="text-muted-foreground text-[0.6875rem] font-medium leading-none">
        Ranked by {label.toLowerCase()}
      </p>
      <p className="text-foreground flex items-center gap-1.5 text-base font-semibold leading-tight tabular-nums">
        {Icon ? (
          <Icon aria-hidden className="text-muted-foreground size-3.5 shrink-0" />
        ) : null}
        <span>
          {value}
          <span className="text-muted-foreground ml-1 text-[0.6875rem] font-normal">
            {unit}
          </span>
        </span>
      </p>
    </div>
  )
}

function ContextInsight({
  icon: Icon,
  label,
}: {
  icon: LucideIcon
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <Icon aria-hidden className="text-muted-foreground size-3 shrink-0 opacity-70" />
      <span>{label}</span>
    </span>
  )
}

function StandingContextRow({
  items,
}: {
  items: Array<{ kind: string; label: string }>
}) {
  if (items.length === 0) return null

  return (
    <p className="text-muted-foreground/80 flex flex-wrap items-center gap-x-2 gap-y-1 pl-10 text-[0.6875rem] leading-snug">
      {items.map((item, index) => (
        <span key={`${item.kind}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span aria-hidden className="text-muted-foreground/50">
              ·
            </span>
          ) : null}
          <ContextInsight
            icon={standingInsightIcon(item.kind)}
            label={item.label}
          />
        </span>
      ))}
    </p>
  )
}

function StandingResult({ standing, className }: StandingResultProps) {
  const { entry, metric, global, country, milestone, insights } = standing
  const metricMeta = METRICS.find((m) => m.key === metric)
  const metricValue = formatMetricValue(metric, entry)
  const metricLabel = metricMeta?.label ?? metric
  const metricUnit = metricUnitLabel(metric)
  const countryMeta = country ? countryByCode(country.code) : null
  const rank = global.rank ?? entry.rank ?? null
  const modelLine = entry.topModels.join(" / ")
  const contextItems = formatStandingContextItems(insights)

  const globalLabel = formatGlobalStandingLabel(global)
  const countryLabel = country ? formatCountryStandingLabel(country) : null
  const milestoneValue = milestone ? formatMilestoneValue(milestone) : null
  const milestoneLabel = milestone ? formatMilestoneLabel(milestone) : null

  return (
    <div
      className={cn(
        "border-border/60 bg-card flex flex-col gap-2.5 rounded-lg border px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={rankBadgeClasses(rank ?? 0)}>{rank ?? "—"}</span>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-sm font-medium">
                {entry.displayName || entry.handle}
              </p>
              {countryMeta ? (
                <span
                  aria-hidden
                  className="shrink-0 text-sm leading-none"
                  title={countryMeta.name}
                >
                  {countryMeta.flag}
                </span>
              ) : null}
              {entry.isAmbassador ? (
                <span className="text-muted-foreground hidden shrink-0 text-[0.6875rem] sm:inline">
                  Ambassador
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">
              @{entry.handle}
            </p>
            {modelLine ? (
              <p
                className="text-muted-foreground mt-1 truncate text-[0.6875rem] leading-snug"
                title={modelLine}
              >
                {modelLine}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 pl-10 sm:flex-col sm:items-end sm:justify-start sm:gap-2 sm:pl-0">
          <MetricSummary
            icon={metricMeta?.icon}
            label={metricLabel}
            value={metricValue}
            unit={metricUnit}
            className="sm:items-end sm:text-right"
          />
          <ProfileLink href={entry.profileUrl} />
        </div>
      </div>

      {(globalLabel || countryLabel || milestoneValue) && (
        <div
          role="group"
          aria-label="Standing context"
          className="flex flex-wrap gap-1.5 pl-10"
        >
          {global.rank !== null && globalLabel ? (
            <StatChip
              icon={Globe}
              value={`#${global.rank}`}
              label={globalLabel}
            />
          ) : null}
          {country && country.rank !== null && countryLabel ? (
            <StatChip
              icon={MapPin}
              value={`#${country.rank}`}
              label={countryLabel}
            />
          ) : null}
          {milestoneValue && milestoneLabel ? (
            <StatChip
              icon={Target}
              value={milestoneValue}
              label={milestoneLabel}
            />
          ) : null}
        </div>
      )}

      <StandingContextRow items={contextItems} />
    </div>
  )
}

function StandingResultSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border-border/60 bg-card flex flex-col gap-2.5 rounded-lg border px-3 py-3 sm:px-4",
        className,
      )}
      aria-busy
      aria-label="Loading standing"
    >
      <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-muted size-7 shrink-0 animate-pulse rounded-md" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="bg-muted h-4 w-40 animate-pulse rounded" />
            <div className="bg-muted h-3 w-24 animate-pulse rounded" />
            <div className="bg-muted h-3 w-56 max-w-full animate-pulse rounded" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 pl-10 sm:flex-col sm:items-end sm:gap-2 sm:pl-0">
          <div className="bg-muted h-8 w-20 animate-pulse rounded" />
          <div className="bg-muted h-3 w-24 animate-pulse rounded" />
        </div>
      </div>
      <div className="flex gap-1.5 pl-10">
        <div className="bg-muted h-6 w-28 animate-pulse rounded-full" />
        <div className="bg-muted h-6 w-32 animate-pulse rounded-full" />
        <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
      </div>
    </div>
  )
}

export { StandingResult, StandingResultSkeleton }
