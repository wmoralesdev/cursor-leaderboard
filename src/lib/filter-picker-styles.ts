import { cn } from "@/lib/utils"

/** Shared trigger styling for leaderboard filter pickers. */
export const filterPickerTriggerClass =
  "border-border bg-secondary/60 text-foreground hover:text-foreground focus-visible:ring-ring/30 aria-expanded:bg-card aria-expanded:shadow-card inline-flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-[color,box-shadow,background-color] outline-none focus-visible:ring-2 [&_svg]:size-3.5 [&_svg]:shrink-0"

export function filterPickerTriggerClassName(className?: string) {
  return cn(filterPickerTriggerClass, className)
}
