import { X } from "lucide-react"

import { countryByCode } from "@/lib/countries"
import { cn } from "@/lib/utils"

type ActiveFiltersProps = {
  country: string | null
  models: string[]
  onCountryChange: (code: string | null) => void
  onModelsChange: (models: string[]) => void
  showCountry?: boolean
  className?: string
}

function FilterChip({
  label,
  prefix,
  onRemove,
  removeLabel,
}: {
  label: string
  prefix?: React.ReactNode
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <span className="border-border/80 bg-secondary/60 text-foreground inline-flex h-6 items-center gap-1 rounded-md border pr-1 pl-2 text-xs">
      {prefix}
      <span className="max-w-[11rem] truncate">{label}</span>
      <button
        type="button"
        aria-label={removeLabel}
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring/30 -mr-0.5 flex size-4 items-center justify-center rounded-sm outline-none transition-colors focus-visible:ring-2"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

function ActiveFilters({
  country,
  models,
  onCountryChange,
  onModelsChange,
  showCountry = true,
  className,
}: ActiveFiltersProps) {
  const activeCountry = country ? countryByCode(country) : null
  const hasFilters =
    (showCountry && Boolean(activeCountry)) || models.length > 0

  if (!hasFilters) return null

  return (
    <div
      role="group"
      aria-label="Active filters"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <span className="text-muted-foreground mr-0.5 text-[0.6875rem] font-medium">
        Filters
      </span>

      {showCountry && activeCountry && (
        <FilterChip
          label={activeCountry.name}
          prefix={
            <span aria-hidden className="text-sm leading-none">
              {activeCountry.flag}
            </span>
          }
          onRemove={() => onCountryChange(null)}
          removeLabel={`Remove ${activeCountry.name} filter`}
        />
      )}

      {models.map((model) => (
        <FilterChip
          key={model}
          label={model}
          onRemove={() => onModelsChange(models.filter((m) => m !== model))}
          removeLabel={`Remove ${model} filter`}
        />
      ))}

      <button
        type="button"
        onClick={() => {
          if (showCountry && activeCountry) onCountryChange(null)
          if (models.length > 0) onModelsChange([])
        }}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/30 ml-0.5 rounded-md px-1.5 py-0.5 text-[0.6875rem] font-medium outline-none transition-colors focus-visible:ring-2"
      >
        Clear all
      </button>
    </div>
  )
}

export { ActiveFilters }
