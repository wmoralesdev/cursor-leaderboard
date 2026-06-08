import { createFileRoute } from "@tanstack/react-router"
import { InvalidHandleError } from "@/server/lib/normalize-handle"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import {
  getEntryByHandle,
  lookupEntry,
} from "@/server/services/entries-service"
import { lookupEntryQuerySchema } from "@/server/validation/entry-schemas"

export const Route = createFileRoute("/api/entries/$handle")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        try {
          const url = new URL(request.url)
          const hasLookupParams =
            url.searchParams.has("metric") ||
            url.searchParams.has("order") ||
            url.searchParams.has("country") ||
            url.searchParams.has("models") ||
            url.searchParams.has("limit")

          if (hasLookupParams) {
            const parsed = lookupEntryQuerySchema.safeParse({
              metric: url.searchParams.get("metric") ?? undefined,
              order: url.searchParams.get("order") ?? undefined,
              country: url.searchParams.get("country") ?? undefined,
              models: url.searchParams.get("models") ?? undefined,
              limit: url.searchParams.get("limit") ?? undefined,
            })

            if (!parsed.success) {
              return errorResponse(400, "Validation failed", {
                issues: parsed.error.flatten(),
              })
            }

            const { metric, order, country, models, limit } = parsed.data

            let result
            try {
              result = await lookupEntry({
                rawHandle: params.handle,
                metric,
                order,
                country,
                models,
                limit,
              })
            } catch (error) {
              const dbError = handleDbError(error)
              if (dbError) return dbError
              throw error
            }

            if (!result) {
              const entry = await getEntryByHandle(params.handle).catch(
                () => null,
              )
              if (!entry) {
                return errorResponse(404, "Entry not found")
              }
              return jsonResponse({
                entry: serializeEntry(entry),
                rank: null,
                rankMetric: metric,
                rankOrder: order,
                rankScope: country ?? null,
                page: null,
                total: 0,
              })
            }

            const { entry, rank, page, total } = result
            return jsonResponse({
              entry: serializeEntry(entry, rank),
              rank,
              rankMetric: metric,
              rankOrder: order,
              rankScope: country ?? null,
              page,
              total,
            })
          }

          let entry
          try {
            entry = await getEntryByHandle(params.handle)
          } catch (error) {
            const dbError = handleDbError(error)
            if (dbError) return dbError
            throw error
          }
          if (!entry) {
            return errorResponse(404, "Entry not found")
          }
          return jsonResponse({ entry: serializeEntry(entry) })
        } catch (error) {
          if (error instanceof InvalidHandleError) {
            return errorResponse(400, error.message)
          }
          throw error
        }
      },
    },
  },
})
