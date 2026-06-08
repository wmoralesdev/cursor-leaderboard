import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Check,
  ChevronsUpDown,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { SortOrder } from "@/lib/api"
import { filterPickerTriggerClassName } from "@/lib/filter-picker-styles"

type SortOption = {
  value: SortOrder
  label: string
  icon: LucideIcon
}

const SORT_OPTIONS: SortOption[] = [
  { value: "desc", label: "Highest first", icon: ArrowDownWideNarrow },
  { value: "asc", label: "Lowest first", icon: ArrowUpWideNarrow },
]

type SortOrderPickerProps = {
  value: SortOrder
  onValueChange: (order: SortOrder) => void
  className?: string
  "aria-label"?: string
}

function SortOrderPicker({
  value,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Sort order",
}: SortOrderPickerProps) {
  const selected =
    SORT_OPTIONS.find((option) => option.value === value) ?? SORT_OPTIONS[0]
  const SelectedIcon = selected.icon

  return (
    <ComboboxPrimitive.Root
      items={SORT_OPTIONS}
      value={selected}
      onValueChange={(option) => {
        if (option) onValueChange(option.value)
      }}
      itemToStringLabel={(option: SortOption) => option.label}
      itemToStringValue={(option: SortOption) => option.value}
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
        <ComboboxPrimitive.Positioner sideOffset={4} align="end" className="z-[60]">
          <ComboboxPrimitive.Popup className="bg-popover text-popover-foreground shadow-popover w-[var(--anchor-width)] overflow-hidden rounded-lg border p-1 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
            <ComboboxPrimitive.List>
              {(option: SortOption) => {
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

export { SortOrderPicker }
