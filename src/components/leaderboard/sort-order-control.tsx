import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react"

import type { SortOrder } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

type SortOrderControlProps = {
  value: SortOrder
  onValueChange: (order: SortOrder) => void
  className?: string
  "aria-label"?: string
}

function SortOrderControl({
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Sort direction",
}: SortOrderControlProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(groupValue) => {
        const next = groupValue[0] as SortOrder | undefined
        if (next) onValueChange(next)
      }}
      aria-label={ariaLabel}
      className={cn("shrink-0", className)}
    >
      <ToggleGroupItem value="desc">
        <ArrowDownWideNarrow />
        <span>High first</span>
      </ToggleGroupItem>
      <ToggleGroupItem value="asc">
        <ArrowUpWideNarrow />
        <span>Low first</span>
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export { SortOrderControl }
