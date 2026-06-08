import { createFileRoute } from "@tanstack/react-router"
import { jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import {
  getLeaderboardStats,
  serializeLeaderboardStats,
} from "@/server/services/leaderboard-stats-service"

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const stats = await getLeaderboardStats()
          return jsonResponse(serializeLeaderboardStats(stats))
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
