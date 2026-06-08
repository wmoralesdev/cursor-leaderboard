import type { LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type StatChipProps = {
  value: string
  label: string
  icon?: LucideIcon
}

function StatChip({ value, label, icon: Icon }: StatChipProps) {
  return (
    <Badge
      variant="outline"
      className="border-border/60 bg-muted/30 text-foreground h-6 gap-1.5 px-2 py-0 font-normal"
    >
      {Icon ? (
        <Icon aria-hidden className="text-muted-foreground size-3 shrink-0" />
      ) : null}
      <span className="max-w-[10rem] truncate tabular-nums font-medium">
        {value}
      </span>
      <span className="text-muted-foreground shrink-0 text-[0.6875rem]">
        {label}
      </span>
    </Badge>
  )
}

export { StatChip }
