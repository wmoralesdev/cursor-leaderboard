import { createFileRoute } from "@tanstack/react-router"
import { InvalidHandleError } from "@/server/lib/normalize-handle"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import {
  EntryNotFoundError,
  RefreshCooldownError,
  getRankForEntry,
  refreshEntry,
} from "@/server/services/entries-service"

export const Route = createFileRoute("/api/entries/$handle/refresh")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        try {
          let entry
          try {
            entry = await refreshEntry(params.handle)
          } catch (error) {
            const dbError = handleDbError(error)
            if (dbError) return dbError
            throw error
          }

          if (entry.scrapeStatus === "not_found") {
            return errorResponse(404, "Cursor profile not found")
          }

          if (entry.scrapeStatus === "parse_error") {
            return errorResponse(502, "Failed to parse profile stats", {
              detail: entry.scrapeError,
            })
          }

          const rank = await getRankForEntry(entry, "agents", entry.country)

          return jsonResponse({
            entry: serializeEntry(entry),
            rank,
            rankMetric: "agents",
            rankScope: entry.country,
          })
        } catch (error) {
          if (error instanceof InvalidHandleError) {
            return errorResponse(400, error.message)
          }
          if (error instanceof EntryNotFoundError) {
            return errorResponse(404, error.message)
          }
          if (error instanceof RefreshCooldownError) {
            return errorResponse(429, error.message, {
              retryAfterSeconds: error.retryAfterSeconds,
            })
          }
          throw error
        }
      },
    },
  },
})
