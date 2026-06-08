import type { LeaderboardStatsDto, MetricKey } from "@/lib/api"
import { cn } from "@/lib/utils"
import { StatChip } from "@/components/ui/stat-chip"
import {
  formatInt,
  formatMetricSum,
  metricUnitLabel,
} from "@/lib/format"

type LeaderboardHeaderStatsProps = {
  stats: LeaderboardStatsDto
  metric: MetricKey
  className?: string
}

function LeaderboardHeaderStats({
  stats,
  metric,
  className,
}: LeaderboardHeaderStatsProps) {
  const metricSum = formatMetricSum(metric, stats.sums)
  const profileLabel = stats.profileCount === 1 ? "profile" : "profiles"
  const sumLabel =
    metric === "currentStreak"
      ? "current streak total"
      : metric === "longestStreak"
        ? "longest streak total"
        : `${metricUnitLabel(metric)} total`

  return (
    <div
      role="group"
      aria-label="Leaderboard totals"
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      <StatChip value={formatInt(stats.profileCount)} label={profileLabel} />
      {metricSum !== null ? (
        <StatChip value={metricSum} label={sumLabel} />
      ) : null}
    </div>
  )
}

export { LeaderboardHeaderStats }
export type { LeaderboardHeaderStatsProps }
