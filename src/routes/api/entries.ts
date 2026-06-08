import { createFileRoute } from "@tanstack/react-router"
import { InvalidHandleError } from "@/server/lib/normalize-handle"
import {
  errorResponse,
  jsonResponse,
  parseJsonBody,
} from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import {
  getRankForEntry,
  submitEntry,
} from "@/server/services/entries-service"
import { submitEntrySchema } from "@/server/validation/entry-schemas"

export const Route = createFileRoute("/api/entries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await parseJsonBody<unknown>(request)
        if (body instanceof Response) return body

        const parsed = submitEntrySchema.safeParse(body)
        if (!parsed.success) {
          return errorResponse(400, "Validation failed", {
            issues: parsed.error.flatten(),
          })
        }

        try {
          let entry
          try {
            entry = await submitEntry(parsed.data.handle, parsed.data.country)
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

          const rank = await getRankForEntry(entry, "agents", parsed.data.country)

          const { getStandingCard } = await import(
            "@/server/services/standing-card-service"
          )
          const standing = await getStandingCard({
            rawHandle: parsed.data.handle,
            metric: "agents",
            order: "desc",
          })

          return jsonResponse({
            entry: serializeEntry(entry),
            rank,
            rankMetric: "agents",
            rankScope: parsed.data.country,
            standing: standing ?? undefined,
          })
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
