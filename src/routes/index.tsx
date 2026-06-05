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
  parseLeaderboardSearch
  
} from "@/lib/leaderboard-seo"
import type {LeaderboardSeoSearch} from "@/lib/leaderboard-seo";
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { LeaderboardPagination } from "@/components/leaderboard/leaderboard-pagination"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { LeaderboardToolbar } from "@/components/leaderboard/leaderboard-toolbar"
import { RankSearch } from "@/components/leaderboard/rank-search"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { useLeaderboardSearch } from "@/lib/use-leaderboard-search"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): LeaderboardSeoSearch =>
    parseLeaderboardSearch(search),
  head: ({ match }) =>
    buildLeaderboardHead(
      parseLeaderboardSearch(
        match.search as Record<string, unknown>,
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
  const data = Route.useLoaderData()
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
  const search = useLeaderboardSearch({
    metric,
    order,
    country: country ?? null,
    limit,
  })

  const searchEntries = search.results?.results.map((item) => item.entry) ?? []

  return (
    <div className="min-h-svh">
      <header className="border-border/60 sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background/80 px-5 backdrop-blur-md">
        <Link
          to="/"
          search={{ metric: "agents", order: "desc", page: 1, limit: 100 }}
          className="flex min-w-0 items-center gap-2 text-sm font-medium outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <img
            src="/CUBE_2D_DARK.png"
            alt="Cursor Leaderboard"
            width={24}
            height={24}
            className="size-4 shrink-0 object-contain"
          />
          <span className="truncate">Cursor Leaderboard</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
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

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-xl font-semibold tracking-tight">
              {activeCountry
                ? `${activeCountry.flag} ${activeCountry.name} leaderboard`
                : "Global leaderboard"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Public Cursor profile stats, ranked for the community.
            </p>
          </div>

          <RankSearch
            query={search.query}
            onQueryChange={search.setQuery}
            onClear={search.clear}
            loading={search.loading}
            isDebouncing={search.isDebouncing}
            error={search.error}
          />
        </div>

        <LeaderboardToolbar
          metric={metric}
          order={order}
          country={country ?? null}
          onMetricChange={setMetric}
          onOrderChange={setOrder}
          onCountryChange={setCountry}
        />

        {search.active ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                {search.isDebouncing
                  ? `Waiting to search for “${search.query.trim()}”…`
                  : search.loading && !search.results
                  ? `Searching for “${search.debouncedQuery}”…`
                  : search.results && search.results.total > searchEntries.length
                    ? `${searchEntries.length} of ${search.results.total} matches for “${search.results.query}”`
                    : search.results
                      ? `${searchEntries.length} match${searchEntries.length === 1 ? "" : "es"} for “${search.results.query}”`
                      : null}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={search.clear}
              >
                Show full board
              </Button>
            </div>

            {search.loading && searchEntries.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                Searching…
              </p>
            ) : searchEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <p className="text-sm font-medium">No profiles match</p>
                <p className="text-muted-foreground max-w-xs text-xs">
                  Try a different name or handle, or join the board if you are
                  not listed yet.
                </p>
                <JoinDialog />
              </div>
            ) : (
              <LeaderboardTable entries={searchEntries} metric={metric} />
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}
