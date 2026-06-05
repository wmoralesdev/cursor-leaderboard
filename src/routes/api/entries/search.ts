import { createFileRoute } from "@tanstack/react-router"

import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import { searchEntries } from "@/server/services/entries-service"
import { searchEntriesQuerySchema } from "@/server/validation/entry-schemas"

export const Route = createFileRoute("/api/entries/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = searchEntriesQuerySchema.safeParse({
          q: url.searchParams.get("q") ?? undefined,
          metric: url.searchParams.get("metric") ?? undefined,
          order: url.searchParams.get("order") ?? undefined,
          country: url.searchParams.get("country") ?? undefined,
          limit: url.searchParams.get("limit") ?? undefined,
        })

        if (!parsed.success) {
          return errorResponse(400, "Validation failed", {
            issues: parsed.error.flatten(),
          })
        }

        const { q, metric, order, country, limit } = parsed.data

        let result
        try {
          result = await searchEntries({
            query: q,
            metric,
            order,
            country,
            limit,
          })
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }

        return jsonResponse({
          query: result.query,
          metric,
          order,
          country: country ?? null,
          total: result.total,
          results: result.results.map(({ entry, rank, page }) => ({
            entry: serializeEntry(entry, rank ?? undefined),
            rank,
            page,
          })),
        })
      },
    },
  },
})
