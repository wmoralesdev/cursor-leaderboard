import { createFileRoute, useNavigate } from "@tanstack/react-router"

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
} from "@/lib/leaderboard-seo"
import type {LeaderboardSeoSearch} from "@/lib/leaderboard-seo";
import { AppNavbar } from "@/components/layout/app-navbar"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { LeaderboardHeaderStats } from "@/components/leaderboard/leaderboard-header-stats"
import { LeaderboardPagination } from "@/components/leaderboard/leaderboard-pagination"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { LeaderboardToolbar } from "@/components/leaderboard/leaderboard-toolbar"
import { RankSearch } from "@/components/leaderboard/rank-search"
import { useLeaderboardSearch } from "@/lib/use-leaderboard-search"
import {
  StandingResult,
  StandingResultSkeleton,
} from "@/components/leaderboard/standing-result"
import { useStandingCard } from "@/lib/use-standing-card"
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
        models: deps.models,
        page: deps.page,
        limit: deps.limit,
      },
    }),
  component: LeaderboardPage,
})

const EMPTY_MODELS: string[] = []

function LeaderboardPage() {
  const search_ = Route.useSearch()
  const { metric, order, country, page, limit } = search_
  const models = search_.models ?? EMPTY_MODELS
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
        const { country: _country, ...rest } = prev
        return next ? { ...rest, country: next, page: 1 } : { ...rest, page: 1 }
      },
    })
  }

  function setModels(next: string[]) {
    navigate({
      search: (prev) => {
        const { models: _models, ...rest } = prev
        return next.length > 0
          ? { ...rest, models: next, page: 1 }
          : { ...rest, page: 1 }
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
    models,
    limit,
  })

  const searchEntries = search.results?.results.map((item) => item.entry) ?? []
  const singleSearchHandle =
    search.active && searchEntries.length === 1 ? searchEntries[0]?.handle : null
  const standing = useStandingCard({
    handle: singleSearchHandle,
    metric,
    order,
    models,
    enabled: Boolean(singleSearchHandle),
  })

  const showSingleMatchStanding =
    Boolean(singleSearchHandle) &&
    (standing.loading || Boolean(standing.standing))
  const showSearchTableFallback =
    Boolean(singleSearchHandle) &&
    !standing.loading &&
    !standing.standing

  return (
    <div className="min-h-svh">
      <AppNavbar />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-6">
          <div className="grid gap-1.5 md:grid-cols-[1fr_auto] md:items-baseline">
            <h1 className="text-xl font-semibold tracking-tight md:col-start-1 md:row-start-1">
              {activeCountry
                ? `${activeCountry.flag} ${activeCountry.name} leaderboard`
                : "Global leaderboard"}
            </h1>
            <p className="text-muted-foreground text-sm md:col-span-2 md:row-start-2">
              Public Cursor profile stats, ranked for the community.
            </p>
            <LeaderboardHeaderStats
              stats={data.stats}
              metric={metric}
              className="md:col-start-2 md:row-start-1 md:justify-self-end"
            />
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
          models={models}
          onMetricChange={setMetric}
          onOrderChange={setOrder}
          onCountryChange={setCountry}
          onModelsChange={setModels}
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
              <>
                {showSingleMatchStanding ? (
                  standing.standing ? (
                    <StandingResult standing={standing.standing} />
                  ) : (
                    <StandingResultSkeleton />
                  )
                ) : null}
                {searchEntries.length > 1 || showSearchTableFallback ? (
                  <LeaderboardTable entries={searchEntries} metric={metric} />
                ) : null}
                {standing.error && singleSearchHandle ? (
                  <p className="text-muted-foreground text-xs">
                    Could not load standing details. Showing basic row instead.
                  </p>
                ) : null}
              </>
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
