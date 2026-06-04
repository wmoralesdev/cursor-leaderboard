const SUFFIX_MULTIPLIERS: Record<string, bigint> = {
  K: 1_000n,
  M: 1_000_000n,
  B: 1_000_000_000n,
  T: 1_000_000_000_000n,
}

export function parseTokenCount(raw: string): bigint | null {
  const normalized = raw.trim().toLowerCase().replace(/,/g, "").replace(/\s*tokens?\s*$/, "")
  if (!normalized) return null

  const match = normalized.match(/^([\d.]+)\s*([kmbt])?$/i)
  if (!match) return null

  const numericPart = Number(match[1])
  if (!Number.isFinite(numericPart) || numericPart < 0) return null

  const suffix = match[2]?.toUpperCase()
  const multiplier = suffix ? (SUFFIX_MULTIPLIERS[suffix] ?? 1n) : 1n
  const scaled = BigInt(Math.round(numericPart * 1000)) * multiplier / 1000n

  return scaled
}
