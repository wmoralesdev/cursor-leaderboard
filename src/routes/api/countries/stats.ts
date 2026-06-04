import { createFileRoute } from "@tanstack/react-router"
import { errorResponse, jsonResponse } from "@/server/lib/api-response"
import { buildCountryStatsDto } from "@/server/lib/serialize-country-stats"
import { handleDbError } from "@/server/lib/handle-db-error"
import { getCountryStats } from "@/server/services/entries-service"
import { countryStatsQuerySchema } from "@/server/validation/country-stats-schemas"

export const Route = createFileRoute("/api/countries/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = countryStatsQuerySchema.safeParse({
          rankBy: url.searchParams.get("rankBy") ?? undefined,
          order: url.searchParams.get("order") ?? undefined,
        })

        if (!parsed.success) {
          return errorResponse(400, "Validation failed", {
            issues: parsed.error.flatten(),
          })
        }

        try {
          const result = await getCountryStats(parsed.data)
          return jsonResponse(buildCountryStatsDto(result))
        } catch (error) {
          const dbError = handleDbError(error)
          if (dbError) return dbError
          throw error
        }
      },
    },
  },
})
