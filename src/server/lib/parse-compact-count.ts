/** Cursor profile abbreviations: K, M, B, T (case-insensitive). */
const SUFFIX_MULTIPLIERS: Record<string, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
  T: 1_000_000_000_000,
}

/** Parse cursor.com compact counts (e.g. 1.1K, 2.5M, 5.2B) into integers for storage/sort. */
export function parseCompactCount(raw: string): number {
  const normalized = raw.trim().replace(/,/g, "")
  if (!normalized) return 0

  const match = normalized.match(/^([\d.]+)\s*([kmbt])?$/i)
  if (!match) {
    const digits = normalized.match(/\d+/)
    return digits ? Number.parseInt(digits[0], 10) : 0
  }

  const numericPart = Number(match[1])
  if (!Number.isFinite(numericPart) || numericPart < 0) return 0

  const suffix = match[2]?.toUpperCase()
  const multiplier = suffix ? (SUFFIX_MULTIPLIERS[suffix] ?? 1) : 1
  return Math.round(numericPart * multiplier)
}
