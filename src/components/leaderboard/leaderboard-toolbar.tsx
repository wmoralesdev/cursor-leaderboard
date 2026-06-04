import type { MetricKey, SortOrder } from "@/lib/api"
import { cn } from "@/lib/utils"
import { MetricTabs } from "@/components/leaderboard/metric-tabs"
import { ScopeFilter } from "@/components/leaderboard/scope-filter"
import { SortOrderControl } from "@/components/leaderboard/sort-order-control"

type LeaderboardToolbarProps = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  onMetricChange: (metric: MetricKey) => void
  onOrderChange: (order: SortOrder) => void
  onCountryChange: (code: string | null) => void
  className?: string
}

function LeaderboardToolbar({
  metric,
  order,
  country,
  onMetricChange,
  onOrderChange,
  onCountryChange,
  className,
}: LeaderboardToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Leaderboard filters"
      className={cn("flex w-full flex-col gap-3", className)}
    >
      <MetricTabs
        value={metric}
        onValueChange={onMetricChange}
        aria-label="Rank by"
      />

      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-3">
        <SortOrderControl
          value={order}
          onValueChange={onOrderChange}
          aria-label="Sort order"
        />
        <ScopeFilter
          country={country}
          onCountryChange={onCountryChange}
          aria-label="Scope"
        />
      </div>
    </div>
  )
}

export { LeaderboardToolbar }
