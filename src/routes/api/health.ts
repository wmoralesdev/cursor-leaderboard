import { createFileRoute } from "@tanstack/react-router"
import { jsonResponse } from "@/server/lib/api-response"

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => jsonResponse({ ok: true }),
    },
  },
})
