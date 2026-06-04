import { cn } from "@/lib/utils"

function rankToneClasses(rank: number): string {
  if (rank === 1) return "bg-brand/16 text-brand/80"
  if (rank === 2) return "bg-brand/12 text-brand/65"
  if (rank === 3) return "bg-brand/8 text-brand/50"
  return "text-muted-foreground"
}

function rankBadgeClasses(rank: number, className?: string): string {
  return cn(
    "grid size-7 shrink-0 place-items-center rounded-md text-xs font-semibold tabular-nums",
    rankToneClasses(rank),
    className
  )
}

export { rankBadgeClasses, rankToneClasses }
