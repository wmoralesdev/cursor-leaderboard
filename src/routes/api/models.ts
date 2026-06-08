import { createFileRoute } from "@tanstack/react-router"

import { jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { getDistinctTopModels } from "@/server/services/entries-service"

export const Route = createFileRoute("/api/models")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const models = await getDistinctTopModels()
          return jsonResponse({ models })
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
