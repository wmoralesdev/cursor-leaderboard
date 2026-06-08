import { createFileRoute, Link } from "@tanstack/react-router"

import { AppNavbar } from "@/components/layout/app-navbar"
import { JoinDialog } from "@/components/leaderboard/join-dialog"
import { listModelStats } from "@/lib/api"
import { formatAgents, formatInt } from "@/lib/format"
import {
  absoluteUrl,
  buildPageHead,
  formatTitle,
  getSiteOrigin,
  SITE,
  websiteJsonLd,
} from "@/lib/seo"
import { rankBadgeClasses } from "@/lib/rank-classes"

export const Route = createFileRoute("/models/")({
  loader: () => listModelStats(),
  head: () => {
    const origin = getSiteOrigin()
    const description =
      "Browse Cursor Leaderboard model cohorts — who runs on each model and where."
    return buildPageHead({
      title: "Model stats",
      description,
      path: "/models",
      jsonLd: [
        websiteJsonLd(origin),
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: formatTitle("Model stats"),
          description,
          url: absoluteUrl("/models"),
          isPartOf: { "@type": "WebSite", name: SITE.name, url: origin },
        },
      ],
    })
  },
  component: ModelsIndexPage,
})

function ModelsIndexPage() {
  const models = Route.useLoaderData()

  return (
    <div className="min-h-svh">
      <AppNavbar />

      <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Model stats</h1>
          <p className="text-muted-foreground text-sm">
            See who on the board leads with each model.
          </p>
        </div>

        {models.length === 0 ? (
          <p className="text-muted-foreground text-sm">No model data yet.</p>
        ) : (
          <ul className="divide-border/60 border-border/60 divide-y border-y">
            {models.map((model, index) => (
              <li key={model.model}>
                <Link
                  to="/models/$model"
                  params={{ model: encodeURIComponent(model.model) }}
                  className="hover:bg-muted/30 flex items-center gap-3 px-1 py-3 transition-colors"
                >
                  <span className={rankBadgeClasses(index + 1)}>{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{model.model}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatInt(model.profileCount)} profiles · avg{" "}
                      {formatAgents(Math.round(model.avgAgentsTotal))} agents
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-center">
          <JoinDialog />
        </div>
      </main>
    </div>
  )
}
