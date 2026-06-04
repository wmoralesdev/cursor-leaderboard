import { profileUrlForHandle } from "@/server/lib/normalize-handle"
import {
  parseCursorProfileHtml,
  type CursorProfileStats,
} from "@/server/lib/parse-cursor-profile"

export type ScrapeProfileResult =
  | { status: "ok"; stats: CursorProfileStats }
  | { status: "not_found" }
  | { status: "parse_error"; error: string }

const DEFAULT_USER_AGENT =
  "cursor-leaderboard/1.0 (+https://github.com/cursor-leaderboard)"

function scrapeUserAgent(): string {
  return process.env.SCRAPE_USER_AGENT?.trim() || DEFAULT_USER_AGENT
}

export async function scrapeCursorProfile(
  handle: string,
): Promise<ScrapeProfileResult> {
  const url = profileUrlForHandle(handle)

  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent": scrapeUserAgent(),
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch profile"
    return { status: "parse_error", error: message }
  }

  if (response.status === 404) {
    return { status: "not_found" }
  }

  if (!response.ok) {
    return {
      status: "parse_error",
      error: `Profile fetch failed with status ${response.status}`,
    }
  }

  const html = await response.text()
  const parsed = parseCursorProfileHtml(html, handle)

  if (!parsed.ok) {
    if (parsed.error === "Profile not found") {
      return { status: "not_found" }
    }
    return { status: "parse_error", error: parsed.error }
  }

  return { status: "ok", stats: parsed.stats }
}
