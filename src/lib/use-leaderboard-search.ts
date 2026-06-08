import { useEffect, useState } from "react"

import {
  
  
  
  
  searchLeaderboard
} from "@/lib/api"
import type {LeaderboardPageSize, MetricKey, SearchResult, SortOrder} from "@/lib/api";
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_LENGTH } from "@/lib/search"

type UseLeaderboardSearchOptions = {
  metric: MetricKey
  order: SortOrder
  country: string | null
  models: string[]
  limit: LeaderboardPageSize
}

function useLeaderboardSearch({
  metric,
  order,
  country,
  models,
  limit,
}: UseLeaderboardSearchOptions) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedInput = query.trim()
  const trimmedDebounced = debouncedQuery.trim()
  const active = trimmedDebounced.length >= SEARCH_MIN_LENGTH
  const isDebouncing =
    trimmedInput.length >= SEARCH_MIN_LENGTH &&
    trimmedInput !== trimmedDebounced
  const modelsKey = models.join("\0")

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
        models,
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
  }, [active, trimmedDebounced, metric, order, country, modelsKey, limit])

  function clear() {
    setQuery("")
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
