import type { CountryRankBy } from "@/lib/country-rank"
import type { SortOrder } from "@/lib/api"
import { cn } from "@/lib/utils"
import { CountryRankTabs } from "@/components/countries/country-rank-tabs"
import { SortOrderControl } from "@/components/leaderboard/sort-order-control"

type CountryStatsToolbarProps = {
  rankBy: CountryRankBy
  order: SortOrder
  onRankByChange: (rankBy: CountryRankBy) => void
  onOrderChange: (order: SortOrder) => void
  className?: string
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
      className={cn(
        "flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-2",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <CountryRankTabs value={rankBy} onValueChange={onRankByChange} />
      </div>
      <SortOrderControl
        value={order}
        onValueChange={onOrderChange}
        aria-label="Sort order"
        className="shrink-0"
      />
    </div>
  )
}

export { CountryStatsToolbar }
