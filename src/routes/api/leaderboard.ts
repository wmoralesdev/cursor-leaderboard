import { createFileRoute } from "@tanstack/react-router"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import {
  getLeaderboard,
  rankForLeaderboardPage,
} from "@/server/services/entries-service"
import { leaderboardQuerySchema } from "@/server/validation/entry-schemas"

export const Route = createFileRoute("/api/leaderboard")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = leaderboardQuerySchema.safeParse({
          metric: url.searchParams.get("metric") ?? undefined,
          order: url.searchParams.get("order") ?? undefined,
          country: url.searchParams.get("country") ?? undefined,
          models: url.searchParams.get("models") ?? undefined,
          page: url.searchParams.get("page") ?? undefined,
          limit: url.searchParams.get("limit") ?? undefined,
        })

        if (!parsed.success) {
          return errorResponse(400, "Validation failed", {
            issues: parsed.error.flatten(),
          })
        }

        const { metric, order, country, models, page, limit } = parsed.data

        let result
        try {
          result = await getLeaderboard({
            metric,
            order,
            country,
            models,
            page,
            limit,
          })
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }

        return jsonResponse({
          metric,
          order,
          country: country ?? null,
          models,
          page,
          limit,
          total: result.total,
          entries: result.entries.map((entry, index) =>
            serializeEntry(
              entry,
              rankForLeaderboardPage({
                order,
                total: result.total,
                page,
                limit,
                index,
              }),
            ),
          ),
        })
      },
    },
  },
})
