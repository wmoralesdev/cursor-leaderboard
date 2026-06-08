import type { MetricKey, SortOrder } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ActiveFilters } from "@/components/leaderboard/active-filters"
import { MetricPicker } from "@/components/leaderboard/metric-picker"
import { ModelFilter } from "@/components/leaderboard/model-filter"
import { ScopePicker } from "@/components/leaderboard/scope-picker"
import { SortOrderPicker } from "@/components/leaderboard/sort-order-picker"

type LeaderboardToolbarProps = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  models: string[]
  onMetricChange: (metric: MetricKey) => void
  onOrderChange: (order: SortOrder) => void
  onCountryChange: (code: string | null) => void
  onModelsChange: (models: string[]) => void
  className?: string
}

function FilterField({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="text-muted-foreground text-[0.6875rem] font-medium">
        {label}
      </span>
      {children}
    </div>
  )
}

function LeaderboardToolbar({
  metric,
  order,
  country,
  models,
  onMetricChange,
  onOrderChange,
  onCountryChange,
  onModelsChange,
  className,
}: LeaderboardToolbarProps) {
  return (
    <section
      aria-label="Browse leaderboard"
      className={cn("flex w-full flex-col gap-2.5", className)}
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <FilterField label="Rank by">
          <MetricPicker
            value={metric}
            onValueChange={onMetricChange}
            aria-label="Rank by"
          />
        </FilterField>

        <FilterField label="Scope">
          <ScopePicker
            country={country}
            onCountryChange={onCountryChange}
            aria-label="Scope"
          />
        </FilterField>

        <FilterField label="Models">
          <ModelFilter value={models} onValueChange={onModelsChange} />
        </FilterField>

        <FilterField label="Sort">
          <SortOrderPicker
            value={order}
            onValueChange={onOrderChange}
            aria-label="Sort order"
          />
        </FilterField>
      </div>

      <ActiveFilters
        country={country}
        models={models}
        onCountryChange={onCountryChange}
        onModelsChange={onModelsChange}
        showCountry={false}
      />
    </section>
  )
}

export { LeaderboardToolbar }
