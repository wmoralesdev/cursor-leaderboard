import { createFileRoute } from "@tanstack/react-router"
import { InvalidHandleError } from "@/server/lib/normalize-handle"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import { serializeEntry } from "@/server/lib/serialize-entry"
import { getEntryByHandle } from "@/server/services/entries-service"

export const Route = createFileRoute("/api/entries/$handle")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
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
