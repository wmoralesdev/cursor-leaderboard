import type { EntryDto } from "@/server/lib/serialize-entry"

const DEV_PREVIEW_ROW_COUNT = 100

export type DevPadOptions = {
  page: number
  limit: number
  rankOffset: number
}

/**
 * In dev only, expand the first page (limit 100) to 100 rows by cycling real
 * entries so the table UI can be stress-tested. Other pages/limits are unchanged
 * so pagination matches production behavior.
 */
export function padLeaderboardEntriesForDev(
  entries: EntryDto[],
  options: DevPadOptions,
): EntryDto[] {
  if (
    !import.meta.env.DEV ||
    entries.length === 0 ||
    options.page !== 1 ||
    options.limit !== DEV_PREVIEW_ROW_COUNT
  ) {
    return entries
  }

  if (entries.length >= DEV_PREVIEW_ROW_COUNT) {
    return entries.slice(0, DEV_PREVIEW_ROW_COUNT).map((entry, index) => ({
      ...entry,
      rank: options.rankOffset + index + 1,
    }))
  }

  return Array.from({ length: DEV_PREVIEW_ROW_COUNT }, (_, index) => {
    const rank = options.rankOffset + index + 1
    const source = entries[index % entries.length]
    return {
      ...source,
      rank,
      id: `${source.id}-dev-preview-${rank}`,
    }
  })
}
