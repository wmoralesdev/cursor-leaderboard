import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown } from "lucide-react"

import {  COUNTRIES, countryByCode } from "@/lib/countries"
import type {Country} from "@/lib/countries";
import { cn } from "@/lib/utils"

type CountryComboboxProps = {
  value: string | null
  onValueChange: (code: string | null) => void
  id?: string
  placeholder?: string
  className?: string
}

function CountryCombobox({
  value,
  onValueChange,
  id,
  placeholder = "Search country…",
  className,
}: CountryComboboxProps) {
  const selected = value ? (countryByCode(value) ?? null) : null

  return (
    <ComboboxPrimitive.Root
      items={COUNTRIES}
      value={selected}
      onValueChange={(country) => onValueChange(country?.code ?? null)}
      itemToStringLabel={(country: Country) => country.name}
      itemToStringValue={(country: Country) => country.code}
    >
      <div className={cn("relative", className)}>
        <ComboboxPrimitive.Input
          id={id}
          placeholder={placeholder}
          className="border-input bg-input/30 placeholder:text-muted-foreground flex h-8 w-full min-w-0 rounded-md border pr-8 pl-2.5 text-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50"
        />
        <ComboboxPrimitive.Icon className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2">
          <ChevronsUpDown className="size-3.5" />
        </ComboboxPrimitive.Icon>
      </div>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} className="z-[60]">
          <ComboboxPrimitive.Popup className="bg-popover text-popover-foreground shadow-popover max-h-72 w-[var(--anchor-width)] overflow-y-auto overscroll-contain rounded-lg border p-1 transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
            <ComboboxPrimitive.Empty className="text-muted-foreground px-2 py-4 text-center text-xs">
              No countries found.
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List>
              {(country: Country) => (
                <ComboboxPrimitive.Item
                  key={country.code}
                  value={country}
                  className="data-highlighted:bg-muted data-selected:text-foreground text-muted-foreground flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none select-none"
                >
                  <span className="text-sm leading-none">{country.flag}</span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <ComboboxPrimitive.ItemIndicator>
                    <Check className="text-foreground size-3.5" />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export { CountryCombobox }
