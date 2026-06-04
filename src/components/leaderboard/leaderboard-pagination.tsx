import { ChevronLeft, ChevronRight } from "lucide-react"

import type { LeaderboardPageSize } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

const PAGE_SIZES: LeaderboardPageSize[] = [25, 50, 100]

type LeaderboardPaginationProps = {
  page: number
  limit: LeaderboardPageSize
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: LeaderboardPageSize) => void
  className?: string
}

function pageWindow(current: number, totalPages: number): number[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = new Set<number>([1, totalPages, current])
  if (current > 1) pages.add(current - 1)
  if (current < totalPages) pages.add(current + 1)

  return [...pages].sort((a, b) => a - b)
}

function LeaderboardPagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  className,
}: LeaderboardPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.min(page, totalPages)
  const start = total === 0 ? 0 : (safePage - 1) * limit + 1
  const end = Math.min(safePage * limit, total)
  const pages = pageWindow(safePage, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-muted-foreground text-xs font-medium">
          Rows per page
        </span>
        <ToggleGroup
          value={[String(limit)]}
          onValueChange={(value) => {
            const next = Number(value[0]) as LeaderboardPageSize
            if (PAGE_SIZES.includes(next)) onLimitChange(next)
          }}
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <ToggleGroupItem key={size} value={String(size)}>
              {size}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <p className="text-muted-foreground text-xs tabular-nums">
          {total === 0 ? (
            "No results"
          ) : (
            <>
              {start}–{end} of {total.toLocaleString()}
            </>
          )}
        </p>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            <ChevronLeft />
          </Button>

          <div
            className="flex items-center gap-0.5"
            role="navigation"
            aria-label="Pagination"
          >
            {pages.map((pageNum, index) => {
              const prev = index > 0 ? pages[index - 1] : undefined
              const showEllipsis =
                prev !== undefined && pageNum - prev > 1
              return (
                <span key={pageNum} className="flex items-center gap-0.5">
                  {showEllipsis && (
                    <span
                      className="text-muted-foreground px-1 text-xs"
                      aria-hidden
                    >
                      …
                    </span>
                  )}
                  <Button
                    type="button"
                    variant={pageNum === safePage ? "secondary" : "ghost"}
                    size="sm"
                    className="min-w-7 px-2 tabular-nums"
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === safePage ? "page" : undefined}
                    onClick={() => onPageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                </span>
              )
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export { LeaderboardPagination }
