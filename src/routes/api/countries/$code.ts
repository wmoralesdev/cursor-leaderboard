import { createFileRoute } from "@tanstack/react-router"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { handleDbError } from "@/server/lib/handle-db-error"
import {
  getCountryDetail,
  serializeCountryDetail,
} from "@/server/services/country-detail-cache-service"

export const Route = createFileRoute("/api/countries/$code")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const country = params.code.trim().toUpperCase()
        if (!/^[A-Z]{2}$/.test(country)) {
          return errorResponse(400, "Country must be a 2-letter ISO code")
        }

        try {
          const detail = await getCountryDetail(country)
          if (!detail) {
            return errorResponse(404, "Country not found on the leaderboard")
          }
          return jsonResponse(serializeCountryDetail(detail))
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
