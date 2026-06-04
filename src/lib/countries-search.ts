import type { SortOrder } from "@/lib/api"
import {
  type CountryRankBy,
  COUNTRY_RANK_PROFILES,
  isCountryRankBy,
} from "@/lib/country-rank"

const SORT_ORDERS: SortOrder[] = ["asc", "desc"]

export type CountriesSearch = {
  rankBy: CountryRankBy
  order: SortOrder
}

export function parseCountriesSearch(
  search: Record<string, unknown>,
): CountriesSearch {
  const rankByRaw =
    typeof search.rankBy === "string" ? search.rankBy : undefined
  const rankBy = rankByRaw && isCountryRankBy(rankByRaw)
    ? rankByRaw
    : COUNTRY_RANK_PROFILES

  const orderRaw =
    typeof search.order === "string" ? search.order.toLowerCase() : undefined
  const order = SORT_ORDERS.includes(orderRaw as SortOrder)
    ? (orderRaw as SortOrder)
    : "desc"

  return { rankBy, order }
}
