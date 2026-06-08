import type { CountryRankBy } from "@/lib/country-rank"
import type { SortOrder } from "@/lib/api"
import { cn } from "@/lib/utils"
import { CountryRankPicker } from "@/components/countries/country-rank-picker"
import { SortOrderPicker } from "@/components/leaderboard/sort-order-picker"

type CountryStatsToolbarProps = {
  rankBy: CountryRankBy
  order: SortOrder
  onRankByChange: (rankBy: CountryRankBy) => void
  onOrderChange: (order: SortOrder) => void
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

function CountryStatsToolbar({
  rankBy,
  order,
  onRankByChange,
  onOrderChange,
  className,
}: CountryStatsToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Country stats filters"
      className={cn("grid grid-cols-2 gap-2 sm:max-w-md", className)}
    >
      <FilterField label="Rank by">
        <CountryRankPicker value={rankBy} onValueChange={onRankByChange} />
      </FilterField>
      <FilterField label="Sort">
        <SortOrderPicker value={order} onValueChange={onOrderChange} />
      </FilterField>
    </div>
  )
}

export { CountryStatsToolbar }
