import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"

import type {
  LeaderboardPageSize,
  LeaderboardResult,
  MetricKey,
  SortOrder,
} from "@/lib/api"
import { getLeaderboard } from "@/lib/api"
import { countryByCode } from "@/lib/countries"
import {
  buildLeaderboardHead,
  parseLeaderboardSearch,
  type LeaderboardSeoSearch,
} from "@/lib/leaderboard-seo"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { LeaderboardPagination } from "@/components/leaderboard/leaderboard-pagination"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { LeaderboardToolbar } from "@/components/leaderboard/leaderboard-toolbar"

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): LeaderboardSeoSearch =>
    parseLeaderboardSearch(search),
  head: ({ match }) =>
    buildLeaderboardHead(
      parseLeaderboardSearch(
        (match.search ?? {}) as Record<string, unknown>,
      ),
    ),
  loaderDeps: ({ search }): LeaderboardSeoSearch =>
    parseLeaderboardSearch(search as Record<string, unknown>),
  loader: ({ deps }: { deps: LeaderboardSeoSearch }): Promise<LeaderboardResult> =>
    getLeaderboard({
      data: {
        metric: deps.metric,
        order: deps.order,
        country: deps.country ?? null,
        page: deps.page,
        limit: deps.limit,
      },
    }),
  component: LeaderboardPage,
})

function LeaderboardPage() {
  const { metric, order, country, page, limit } = Route.useSearch()
  const data = Route.useLoaderData() as LeaderboardResult
  const navigate = useNavigate({ from: Route.fullPath })

  function setMetric(next: MetricKey) {
    navigate({ search: (prev) => ({ ...prev, metric: next, page: 1 }) })
  }

  function setOrder(next: SortOrder) {
    navigate({ search: (prev) => ({ ...prev, order: next, page: 1 }) })
  }

  function setCountry(next: string | null) {
    navigate({
      search: (prev) => {
        const base = {
          metric: prev.metric,
          order: prev.order,
          page: 1,
          limit: prev.limit,
        }
        return next ? { ...base, country: next } : base
      },
    })
  }

  function setPage(next: number) {
    navigate({ search: (prev) => ({ ...prev, page: next }) })
  }

  function setLimit(next: LeaderboardPageSize) {
    navigate({ search: (prev) => ({ ...prev, limit: next, page: 1 }) })
  }

  const activeCountry = country ? countryByCode(country) : null

  return (
    <div className="min-h-svh">
      <header className="border-border/60 sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background/80 px-5 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <img
            src="/CUBE_2D_DARK.png"
            alt="Cursor Leaderboard"
            width={24}
            height={24}
           className="size-4 shrink-0 object-contain"
          />
          <span className="truncate">Cursor Leaderboard</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/countries"
            search={{ rankBy: "profiles", order: "desc" }}
            className="text-muted-foreground hover:text-foreground text-xs transition-colors"
          >
            Countries
          </Link>
          <JoinDialog />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-5 py-10">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight">
            {activeCountry
              ? `${activeCountry.flag} ${activeCountry.name} leaderboard`
              : "Global leaderboard"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Cursor power users ranked by their public profile stats.
          </p>
        </div>

        <LeaderboardToolbar
          metric={metric}
          order={order}
          country={country ?? null}
          onMetricChange={setMetric}
          onOrderChange={setOrder}
          onCountryChange={setCountry}
        />

        <LeaderboardTable
          entries={data.entries}
          metric={metric}
          emptyAction={<JoinDialog />}
        />

        <LeaderboardPagination
          page={page}
          limit={limit}
          total={data.total}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </main>
    </div>
  )
}
