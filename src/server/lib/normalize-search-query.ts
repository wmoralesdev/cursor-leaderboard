import { COUNTRIES } from "@/lib/countries"
import { SEARCH_MAX_RESULTS, SEARCH_MIN_LENGTH } from "@/lib/search"

export { SEARCH_MIN_LENGTH, SEARCH_MAX_RESULTS }

const COUNTRY_ALIASES: Record<string, string> = {
  uk: "GB",
  usa: "US",
  uae: "AE",
}

/** Pull a handle-like term from pasted URLs or @handles. */
export function extractSearchTerm(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""

  let candidate = trimmed

  try {
    if (candidate.includes("cursor.com")) {
      const url = new URL(
        candidate.startsWith("http") ? candidate : `https://${candidate}`,
      )
      const match = url.pathname.match(/^\/@([^/]+)\/?$/)
      if (match?.[1]) return match[1].toLowerCase()
    }
  } catch {
    /* fall through */
  }

  if (candidate.startsWith("@")) {
    candidate = candidate.slice(1)
  }

  return candidate.toLowerCase()
}

export function matchCountryCodes(rawQuery: string): string[] {
  const raw = rawQuery.trim().toLowerCase()
  if (raw.length < SEARCH_MIN_LENGTH) return []

  const alias = COUNTRY_ALIASES[raw]
  if (alias) return [alias]

  const matches = COUNTRIES.filter(
    (country) =>
      country.code.toLowerCase() === raw ||
      country.name.toLowerCase().includes(raw),
  ).map((country) => country.code)

  return [...new Set(matches)]
}

/** Lower score means a stronger match. */
export function matchScore(
  entry: { handle: string; displayName: string | null; country: string },
  handleTerm: string,
  rawQuery: string,
  matchedCountryCodes: string[],
): number {
  const handle = entry.handle.toLowerCase()
  const name = (entry.displayName ?? "").toLowerCase()
  const term = handleTerm.toLowerCase()
  const raw = rawQuery.trim().toLowerCase()

  if (term && handle === term) return 0
  if (term && handle.startsWith(term)) return 1
  if (raw && name.startsWith(raw)) return 2
  if (term && handle.includes(term)) return 3
  if (raw && name.includes(raw)) return 4

  if (matchedCountryCodes.includes(entry.country)) {
    const country = COUNTRIES.find((item) => item.code === entry.country)
    if (country) {
      const countryName = country.name.toLowerCase()
      if (countryName === raw || country.code.toLowerCase() === raw) return 5
      if (countryName.startsWith(raw)) return 6
      return 7
    }
  }

  return 8
}
