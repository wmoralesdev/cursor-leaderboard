import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, Globe } from "lucide-react"

import { COUNTRIES } from "@/lib/countries"
import { filterPickerTriggerClassName } from "@/lib/filter-picker-styles"

const GLOBAL_VALUE = "__global__"

type ScopeOption = {
  value: string
  label: string
  flag?: string
  icon?: typeof Globe
}

const SCOPE_OPTIONS: ScopeOption[] = [
  { value: GLOBAL_VALUE, label: "Global", icon: Globe },
  ...COUNTRIES.map((country) => ({
    value: country.code,
    label: country.name,
    flag: country.flag,
  })),
]

type ScopePickerProps = {
  country: string | null
  onCountryChange: (code: string | null) => void
  className?: string
  "aria-label"?: string
}

function ScopePicker({
  country,
  onCountryChange,
  className,
  "aria-label": ariaLabel = "Scope",
}: ScopePickerProps) {
  const selectedValue = country ?? GLOBAL_VALUE
  const selected =
    SCOPE_OPTIONS.find((option) => option.value === selectedValue) ??
    SCOPE_OPTIONS[0]
  const SelectedIcon = selected.icon

  return (
    <ComboboxPrimitive.Root
      items={SCOPE_OPTIONS}
      value={selected}
      onValueChange={(option) => {
        if (!option) return
        onCountryChange(option.value === GLOBAL_VALUE ? null : option.value)
      }}
      itemToStringLabel={(option: ScopeOption) => option.label}
      itemToStringValue={(option: ScopeOption) => option.value}
    >
      <ComboboxPrimitive.Trigger
        aria-label={ariaLabel}
        className={filterPickerTriggerClassName(className)}
      >
        {SelectedIcon ? (
          <SelectedIcon aria-hidden />
        ) : (
          <span aria-hidden className="text-sm leading-none">
            {selected.flag}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">{selected.label}</span>
        <ChevronsUpDown className="text-muted-foreground" aria-hidden />
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-[60]">
          <ComboboxPrimitive.Popup className="bg-popover text-popover-foreground shadow-popover w-[var(--anchor-width)] overflow-hidden rounded-lg border transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
            <ComboboxPrimitive.Input
              placeholder="Search scope…"
              className="border-border/60 placeholder:text-muted-foreground flex h-9 w-full min-w-0 border-b bg-transparent px-2.5 text-xs outline-none"
            />
            <ComboboxPrimitive.Empty className="text-muted-foreground px-2 py-4 text-center text-xs">
              No matches.
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="max-h-64 overflow-y-auto overscroll-contain p-1">
              {(option: ScopeOption) => {
                const Icon = option.icon
                return (
                  <ComboboxPrimitive.Item
                    key={option.value}
                    value={option}
                    className="data-highlighted:bg-muted data-selected:text-foreground text-muted-foreground flex cursor-default items-center gap-2 rounded-md px-2 py-2 text-xs outline-none select-none"
                  >
                    {Icon ? (
                      <Icon className="size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <span aria-hidden className="text-sm leading-none">
                        {option.flag}
                      </span>
                    )}
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

export { ScopePicker }
