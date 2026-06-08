import { createFileRoute } from "@tanstack/react-router"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import {
  getModelStats,
  listModelStats,
  serializeModelStats,
} from "@/server/services/model-stats-cache-service"

export const Route = createFileRoute("/api/models/$model")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url)
        const listAll = url.searchParams.get("list") === "1"

        try {
          if (listAll) {
            const models = await listModelStats()
            return jsonResponse({
              models: models.map(serializeModelStats),
            })
          }

          const stats = await getModelStats(decodeURIComponent(params.model))
          if (!stats) {
            return errorResponse(404, "Model not found on the leaderboard")
          }
          return jsonResponse(serializeModelStats(stats))
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
