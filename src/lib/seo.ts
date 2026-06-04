export const SITE = {
  name: "Cursor Leaderboard",
  defaultDescription:
    "Community leaderboard for public Cursor profile stats — agents, tokens, and streaks. Join, find your rank, and browse by country.",
  locale: "en_US",
  themeColor: "#14120B",
  ogImagePath: "/CUBE_2D_DARK.png",
} as const

export type HeadMeta = {
  title?: string
  name?: string
  property?: string
  content?: string
  charSet?: string
}

export type HeadLink = {
  rel: string
  href: string
  type?: string
  sizes?: string
  hreflang?: string
}

export type HeadScript = {
  type?: string
  children: string
}

export type PageHead = {
  meta: HeadMeta[]
  links?: HeadLink[]
  scripts?: HeadScript[]
}

export function getSiteOrigin(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL?.trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "")
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return "http://localhost:3000"
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${getSiteOrigin()}${normalized}`
}

export function formatTitle(pageTitle?: string): string {
  if (!pageTitle || pageTitle === SITE.name) {
    return SITE.name
  }
  return `${pageTitle} · ${SITE.name}`
}

export function productionRobots(robots: string): string {
  return import.meta.env.DEV ? "noindex,nofollow" : robots
}

export type PageSeoInput = {
  title: string
  description?: string
  path: string
  robots?: string
  ogType?: string
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

export function buildPageHead(input: PageSeoInput): PageHead {
  const description = input.description ?? SITE.defaultDescription
  const title = formatTitle(input.title)
  const canonical = absoluteUrl(input.path)
  const ogImage = absoluteUrl(SITE.ogImagePath)
  const robots = productionRobots(input.robots ?? "index,follow")

  const meta: HeadMeta[] = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { property: "og:site_name", content: SITE.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:type", content: input.ogType ?? "website" },
    { property: "og:image", content: ogImage },
    { property: "og:locale", content: SITE.locale },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: ogImage },
  ]

  const links: HeadLink[] = [{ rel: "canonical", href: canonical }]

  const jsonLdItems = input.jsonLd
    ? Array.isArray(input.jsonLd)
      ? input.jsonLd
      : [input.jsonLd]
    : []

  const scripts: HeadScript[] = jsonLdItems.map((item) => ({
    type: "application/ld+json",
    children: JSON.stringify(item),
  }))

  return {
    meta,
    links,
    ...(scripts.length > 0 ? { scripts } : {}),
  }
}

export function websiteJsonLd(origin: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    description: SITE.defaultDescription,
    url: origin,
    inLanguage: "en",
  }
}

export function buildSitemapXml(origin: string): string {
  const urls = ["/", "/countries"]
  const lastmod = new Date().toISOString().slice(0, 10)
  const entries = urls
    .map(
      (path) => `  <url>
    <loc>${escapeXml(`${origin}${path}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === "/" ? "1.0" : "0.8"}</priority>
  </url>`,
    )
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`
}

export function buildRobotsTxt(origin: string): string {
  const base = origin.replace(/\/$/, "")
  const lines = ["User-agent: *", "Allow: /"]
  if (!import.meta.env.DEV) {
    lines.push("Disallow: /api/")
  }
  lines.push("", `Sitemap: ${base}/sitemap.xml`)
  return `${lines.join("\n")}\n`
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}
