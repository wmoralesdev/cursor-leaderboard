"use client"

import { useEffect, useState } from "react"

import { getStandingCard } from "@/lib/api"
import type { MetricKey, SortOrder, StandingCardDto } from "@/lib/api"

type UseStandingCardOptions = {
  handle: string | null
  metric: MetricKey
  order: SortOrder
  models: string[]
  enabled?: boolean
}

function useStandingCard({
  handle,
  metric,
  order,
  models,
  enabled = true,
}: UseStandingCardOptions) {
  const [standing, setStanding] = useState<StandingCardDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const modelsKey = models.join("\0")

  useEffect(() => {
    if (!enabled || !handle?.trim()) {
      setStanding(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void getStandingCard({
      data: {
        handle: handle.trim(),
        metric,
        order,
        models,
      },
    })
      .then((result) => {
        if (!cancelled) setStanding(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setStanding(null)
          setError(err instanceof Error ? err.message : "Failed to load standing")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, handle, metric, order, modelsKey])

  return { standing, loading, error }
}

export { useStandingCard }
