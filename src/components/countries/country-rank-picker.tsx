import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { CountryRankBy } from "@/lib/country-rank"
import { COUNTRY_RANK_PROFILES } from "@/lib/country-rank"
import { METRICS } from "@/lib/format"
import { filterPickerTriggerClassName } from "@/lib/filter-picker-styles"

type RankOption = {
  value: CountryRankBy
  label: string
  icon: LucideIcon
}

const RANK_OPTIONS: RankOption[] = [
  { value: COUNTRY_RANK_PROFILES, label: "Most profiles", icon: Users },
  ...METRICS.filter((metric) => metric.key !== "joined").map((metric) => ({
    value: metric.key as CountryRankBy,
    label: metric.label,
    icon: metric.icon,
  })),
]

type CountryRankPickerProps = {
  value: CountryRankBy
  onValueChange: (rankBy: CountryRankBy) => void
  className?: string
  "aria-label"?: string
}

function CountryRankPicker({
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Rank countries by",
}: CountryRankPickerProps) {
  const selected =
    RANK_OPTIONS.find((option) => option.value === value) ?? RANK_OPTIONS[0]
  const SelectedIcon = selected.icon

  return (
    <ComboboxPrimitive.Root
      items={RANK_OPTIONS}
      value={selected}
      onValueChange={(option) => {
        if (option) onValueChange(option.value)
      }}
      itemToStringLabel={(option: RankOption) => option.label}
      itemToStringValue={(option: RankOption) => option.value}
    >
      <ComboboxPrimitive.Trigger
        aria-label={ariaLabel}
        className={filterPickerTriggerClassName(className)}
      >
        <SelectedIcon aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">{selected.label}</span>
        <ChevronsUpDown className="text-muted-foreground" aria-hidden />
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-[60]">
          <ComboboxPrimitive.Popup className="bg-popover text-popover-foreground shadow-popover w-[var(--anchor-width)] overflow-hidden rounded-lg border transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
            <ComboboxPrimitive.List className="max-h-64 overflow-y-auto overscroll-contain p-1">
              {(option: RankOption) => {
                const Icon = option.icon
                return (
                  <ComboboxPrimitive.Item
                    key={option.value}
                    value={option}
                    className="data-highlighted:bg-muted data-selected:text-foreground text-muted-foreground flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-xs outline-none select-none"
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{option.label}</span>
                    <ComboboxPrimitive.ItemIndicator>
                      <Check className="text-foreground size-3.5" />
                    </ComboboxPrimitive.ItemIndicator>
                  </ComboboxPrimitive.Item>
                )
              }}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export { CountryRankPicker }
