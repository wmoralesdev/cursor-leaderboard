import * as cheerio from "cheerio"
import { parseTokenCount } from "@/server/lib/parse-token-count"

export type CursorProfileStats = {
  displayName: string | null
  isAmbassador: boolean
  joinedDaysAgo: number | null
  agentsTotal: number
  agentsLocal: number
  agentsCloud: number
  currentStreakDays: number
  longestStreakDays: number
  longestAgentHours: number
  tokensTotal: bigint
  topModels: string[]
}

export type ParseProfileResult =
  | { ok: true; stats: CursorProfileStats }
  | { ok: false; error: string }

function extractLabelValue(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `${escaped}</span><span[^>]*>([^<]+)</span>`,
    "i",
  )
  const match = html.match(re)
  return match?.[1]?.trim() ?? null
}

function parseDays(value: string | null): number {
  if (!value) return 0
  const match = value.match(/(\d+)\s*d/i)
  return match ? Number.parseInt(match[1], 10) : 0
}

function parseHours(value: string | null): number {
  if (!value) return 0
  const match = value.match(/([\d.]+)\s*h/i)
  return match ? Number.parseFloat(match[1]) : 0
}

function parseIntStat(value: string | null): number {
  if (!value) return 0
  const digits = value.replace(/,/g, "").match(/\d+/)
  return digits ? Number.parseInt(digits[0], 10) : 0
}

function extractTopModels(html: string): string[] {
  const modelsIndex = html.indexOf(">Models<")
  if (modelsIndex < 0) return []

  const section = html.slice(modelsIndex, modelsIndex + 12_000)
  const $ = cheerio.load(section)
  const models: string[] = []

  $("p[title]").each((_, el) => {
    const title = $(el).attr("title")?.trim()
    if (title && !models.includes(title)) {
      models.push(title)
    }
  })

  if (models.length > 0) return models.slice(0, 3)

  const titleMatches = section.matchAll(/title="([^"]+)"/g)
  for (const match of titleMatches) {
    const name = match[1]?.trim()
    if (!name || models.includes(name)) continue
    if (/composer|claude|gpt|gemini|sonnet|opus|auto/i.test(name)) {
      models.push(name)
    }
    if (models.length >= 3) break
  }

  return models
}

export function parseCursorProfileHtml(
  html: string,
  expectedHandle?: string,
): ParseProfileResult {
  if (!html.trim()) {
    return { ok: false, error: "Empty profile HTML" }
  }

  const lower = html.toLowerCase()
  if (
    lower.includes("page not found") ||
    lower.includes("this profile could not be found")
  ) {
    return { ok: false, error: "Profile not found" }
  }

  const $ = cheerio.load(html)
  const displayName = $("h1").first().text().trim() || null

  const agentsTotal = parseIntStat(extractLabelValue(html, "Agents"))
  const hasCoreStats =
    agentsTotal > 0 ||
    extractLabelValue(html, "Tokens") !== null ||
    extractLabelValue(html, "Longest Streak") !== null

  if (!hasCoreStats) {
    return { ok: false, error: "Could not parse profile stats from HTML" }
  }

  const tokensRaw =
    html.match(/Tokens<\/p><p[^>]*>([^<]+)</i)?.[1] ??
    extractLabelValue(html, "Tokens")
  const tokensParsed = tokensRaw ? parseTokenCount(tokensRaw) : null

  const stats: CursorProfileStats = {
    displayName,
    isAmbassador: html.includes("Cursor Ambassador"),
    joinedDaysAgo: (() => {
      const joined = html.match(/Joined\s+(\d+)\s+days\s+ago/i)
      return joined ? Number.parseInt(joined[1], 10) : null
    })(),
    agentsTotal,
    agentsLocal: (() => {
      const match = html.match(/Local\s*\((\d+)\)/i)
      return match ? Number.parseInt(match[1], 10) : 0
    })(),
    agentsCloud: (() => {
      const match = html.match(/Cloud\s*\((\d+)\)/i)
      return match ? Number.parseInt(match[1], 10) : 0
    })(),
    currentStreakDays: parseDays(extractLabelValue(html, "Current Streak")),
    longestStreakDays: parseDays(extractLabelValue(html, "Longest Streak")),
    longestAgentHours: parseHours(extractLabelValue(html, "Longest Agent")),
    tokensTotal: tokensParsed ?? 0n,
    topModels: extractTopModels(html),
  }

  if (expectedHandle && !html.toLowerCase().includes(expectedHandle.toLowerCase())) {
    return { ok: false, error: "Handle mismatch in profile HTML" }
  }

  return { ok: true, stats }
}
