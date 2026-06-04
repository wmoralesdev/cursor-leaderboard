import { createFileRoute } from "@tanstack/react-router"

import { buildRobotsTxt, getSiteOrigin } from "@/lib/seo"

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(buildRobotsTxt(getSiteOrigin()), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
})
