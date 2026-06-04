import { Users } from "lucide-react"

import type { CountryRankBy } from "@/lib/country-rank"
import { COUNTRY_RANK_PROFILES, COUNTRY_RANK_BY_VALUES } from "@/lib/country-rank"
import { METRICS } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type CountryRankTabsProps = {
  value: CountryRankBy
  onValueChange: (rankBy: CountryRankBy) => void
  className?: string
  "aria-label"?: string
}

function CountryRankTabs({
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Rank countries by",
}: CountryRankTabsProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        const next = groupValue[0]
        if (next && COUNTRY_RANK_BY_VALUES.includes(next as CountryRankBy)) {
          onValueChange(next as CountryRankBy)
        }
      }}
      aria-label={ariaLabel}
      className={cn(
        "grid w-full grid-cols-2 gap-0.5 sm:grid-cols-3 md:grid-cols-5",
        className,
      )}
    >
      <ToggleGroupItem
        value={COUNTRY_RANK_PROFILES}
        className="w-full px-1.5 sm:px-2.5"
      >
        <Users />
        <span className="hidden sm:inline">Most profiles</span>
        <span className="sm:hidden">Profiles</span>
      </ToggleGroupItem>
      {METRICS.map((metric) => (
        <ToggleGroupItem
          key={metric.key}
          value={metric.key}
          className="w-full px-1.5 sm:px-2.5"
        >
          <metric.icon />
          <span className="hidden sm:inline">{metric.label}</span>
          <span className="sm:hidden">{metric.shortLabel}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export { CountryRankTabs }
