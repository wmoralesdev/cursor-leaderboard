import { createFileRoute } from "@tanstack/react-router"
import { InvalidHandleError } from "@/server/lib/normalize-handle"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { getStandingCard } from "@/server/services/standing-card-service"
import { lookupEntryQuerySchema } from "@/server/validation/entry-schemas"

export const Route = createFileRoute("/api/entries/$handle/standing")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url)
        const parsed = lookupEntryQuerySchema.safeParse({
          metric: url.searchParams.get("metric") ?? undefined,
          order: url.searchParams.get("order") ?? undefined,
          models: url.searchParams.get("models") ?? undefined,
        })

        if (!parsed.success) {
          return errorResponse(400, "Validation failed", {
            issues: parsed.error.flatten(),
          })
        }

        try {
          const standing = await getStandingCard({
            rawHandle: params.handle,
            metric: parsed.data.metric,
            order: parsed.data.order,
            models: parsed.data.models,
          })

          if (!standing) {
            return errorResponse(404, "Entry not found or stats unavailable")
          }

          return jsonResponse(standing)
        } catch (error) {
          if (error instanceof InvalidHandleError) {
            return errorResponse(400, error.message)
          }
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
