import { useEffect, useState } from "react"
import { Globe } from "lucide-react"

import { CountryCombobox } from "@/components/ui/combobox"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type ScopeFilterProps = {
  country: string | null
  onCountryChange: (code: string | null) => void
  className?: string
  "aria-label"?: string
}

function ScopeFilter({
  country,
  onCountryChange,
  className,
  "aria-label": ariaLabel = "Leaderboard scope",
}: ScopeFilterProps) {
  const [countryMode, setCountryMode] = useState(Boolean(country))

  useEffect(() => {
    if (country) setCountryMode(true)
  }, [country])

  const scope = countryMode ? "country" : "global"

  return (
    <>
      <ToggleGroup
        value={[scope]}
        onValueChange={(groupValue) => {
          const next = groupValue[0] as "global" | "country" | undefined
          if (!next) return
          if (next === "global") {
            setCountryMode(false)
            onCountryChange(null)
            return
          }
          setCountryMode(true)
        }}
        aria-label={ariaLabel}
        className={cn("ml-auto", className)}
      >
        <ToggleGroupItem value="global">
          <Globe />
          Global
        </ToggleGroupItem>
        <ToggleGroupItem value="country">Country</ToggleGroupItem>
      </ToggleGroup>

      {countryMode && (
        <CountryCombobox
          value={country}
          onValueChange={onCountryChange}
          className="w-full sm:w-44"
          placeholder="Pick a country…"
        />
      )}
    </>
  )
}

export { ScopeFilter }
