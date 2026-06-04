import type { MetricKey } from "@/lib/api"
import { METRICS } from "@/lib/format"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type MetricTabsProps = {
  value: MetricKey
  onValueChange: (metric: MetricKey) => void
  className?: string
  "aria-label"?: string
}

function MetricTabs({
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Leaderboard metric",
}: MetricTabsProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        const next = groupValue[0] as MetricKey | undefined
        if (next) onValueChange(next)
      }}
      aria-label={ariaLabel}
      className={cn("grid w-full grid-cols-4", className)}
    >
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

export { MetricTabs }
