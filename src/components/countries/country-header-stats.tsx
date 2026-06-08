import type { CountryStatsHeaderDto } from "@/server/lib/serialize-country-stats"
import { cn } from "@/lib/utils"
import { formatInt } from "@/lib/format"

type CountryHeaderStatsProps = {
  header: CountryStatsHeaderDto
  className?: string
}

function CountryHeaderStats({ header, className }: CountryHeaderStatsProps) {
  const countryLabel = header.countryCount === 1 ? "country" : "countries"

  return (
    <div
      role="group"
      aria-label="Country stats summary"
      className={cn(
        "border-border/60 bg-card/50 flex items-stretch rounded-lg border",
        className,
      )}
    >
      <div className="flex flex-col justify-center gap-1 px-3.5 py-2.5">
        <span className="text-foreground text-lg font-semibold leading-none tabular-nums">
          {formatInt(header.countryCount)}
        </span>
        <span className="text-muted-foreground text-[11px] leading-none">
          {countryLabel}
        </span>
      </div>

      <div className="border-border/60 flex min-w-0 flex-col justify-center gap-1 border-l px-3.5 py-2.5">
        <span className="text-muted-foreground text-[11px] leading-none">
          top model
        </span>
        <span
          className="text-foreground max-w-[13rem] truncate text-[13px] font-medium leading-none"
          title={header.topModel ?? undefined}
        >
          {header.topModel ?? "not enough data"}
        </span>
      </div>
    </div>
  )
}

export { CountryHeaderStats }
