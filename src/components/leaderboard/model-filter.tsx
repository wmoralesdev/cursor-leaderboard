import { useEffect, useState } from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { getTopModels } from "@/lib/api"
import { filterPickerTriggerClassName } from "@/lib/filter-picker-styles"
import { cn } from "@/lib/utils"

type ModelFilterProps = {
  value: string[]
  onValueChange: (models: string[]) => void
  className?: string
}

function ModelFilter({ value, onValueChange, className }: ModelFilterProps) {
  const [catalog, setCatalog] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    void getTopModels()
      .then((result) => {
        if (!cancelled) setCatalog(result.models)
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalog([])
          setError(
            err instanceof Error ? err.message : "Could not load model list.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const count = value.length
  const disabled = !loading && !error && catalog.length === 0
  const triggerLabel = loading
    ? "Loading models…"
    : disabled
      ? "No models yet"
      : "Models"

  return (
    <ComboboxPrimitive.Root
      items={catalog}
      multiple
      value={value}
      onValueChange={(next: string[]) => onValueChange(next)}
      itemToStringLabel={(model: string) => model}
      itemToStringValue={(model: string) => model}
    >
      <ComboboxPrimitive.Trigger
        disabled={loading || disabled}
        title={error ?? undefined}
        className={filterPickerTriggerClassName(
          cn(count > 0 && "text-foreground", className),
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{triggerLabel}</span>
        {count > 0 && (
          <span className="bg-foreground/10 text-foreground inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.625rem] leading-none tabular-nums">
            {count}
          </span>
        )}
        <ChevronsUpDown className="text-muted-foreground" aria-hidden />
      </ComboboxPrimitive.Trigger>

      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner sideOffset={4} align="end" className="z-[60]">
          <ComboboxPrimitive.Popup className="bg-popover text-popover-foreground shadow-popover w-64 overflow-hidden rounded-lg border transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0">
            <div className="border-border/60 relative border-b">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <ComboboxPrimitive.Input
                placeholder="Search models…"
                className="placeholder:text-muted-foreground flex h-9 w-full min-w-0 bg-transparent pr-2.5 pl-8 text-xs outline-none"
              />
            </div>

            <div className="max-h-64 overflow-y-auto overscroll-contain p-1">
              <ComboboxPrimitive.Empty className="text-muted-foreground px-2 py-6 text-center text-xs">
                No models found.
              </ComboboxPrimitive.Empty>
              <ComboboxPrimitive.List>
                {(model: string) => (
                  <ComboboxPrimitive.Item
                    key={model}
                    value={model}
                    className="data-highlighted:bg-muted data-selected:text-foreground text-muted-foreground flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-none select-none"
                  >
                    <span
                      aria-hidden
                      className="border-border/80 flex size-4 shrink-0 items-center justify-center rounded-[4px] border"
                    >
                      <ComboboxPrimitive.ItemIndicator>
                        <Check className="size-3" />
                      </ComboboxPrimitive.ItemIndicator>
                    </span>
                    <span className="flex-1 truncate">{model}</span>
                  </ComboboxPrimitive.Item>
                )}
              </ComboboxPrimitive.List>
            </div>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

export { ModelFilter }
