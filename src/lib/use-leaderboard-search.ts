import { useEffect, useState } from "react"
import { debounce, useQueryState } from "nuqs"

import { searchLeaderboard } from "@/lib/api"
import type {
  LeaderboardPageSize,
  MetricKey,
  SearchResult,
  SortOrder,
} from "@/lib/api"
import { leaderboardSearchParams } from "@/lib/leaderboard-search-params"
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from "@/lib/search"

type UseLeaderboardSearchOptions = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  limit: LeaderboardPageSize
}

function useLeaderboardSearch({
  metric,
  order,
  country,
  limit,
}: UseLeaderboardSearchOptions) {
  const [query, setQueryState] = useQueryState("q", leaderboardSearchParams.q)
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedInput = query.trim()
  const trimmedDebounced = debouncedQuery.trim()
  const active = trimmedDebounced.length >= SEARCH_MIN_LENGTH
  const isDebouncing =
    trimmedInput.length >= SEARCH_MIN_LENGTH &&
    trimmedInput !== trimmedDebounced

  useEffect(() => {
    if (!trimmedInput) {
      setDebouncedQuery("")
      return
    }

    const timer = window.setTimeout(() => {
      setDebouncedQuery(trimmedInput)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [trimmedInput])

  useEffect(() => {
    if (!active) {
      setResults(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void searchLeaderboard({
      data: {
        q: trimmedDebounced,
        metric,
        order,
        country,
        limit,
      },
    })
      .then((next) => {
        if (!cancelled) setResults(next)
      })
      .catch((err) => {
        if (!cancelled) {
          setResults(null)
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Try again.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [active, trimmedDebounced, metric, order, country, limit])

  function setQuery(value: string) {
    void setQueryState(value, {
      limitUrlUpdates:
        value.trim() === "" ? undefined : debounce(SEARCH_DEBOUNCE_MS),
    })
  }

  function clear() {
    void setQueryState(null)
    setDebouncedQuery("")
    setResults(null)
    setError(null)
    setLoading(false)
  }

  return {
    query,
    setQuery,
    debouncedQuery: trimmedDebounced,
    results,
    loading,
    isDebouncing,
    error,
    active,
    clear,
  }
}

export { useLeaderboardSearch }
