import {
  createStandardSchemaV1,
  parseAsStringLiteral
  
} from "nuqs/server"
import type {inferParserType} from "nuqs/server";

import type { SortOrder } from "@/lib/api"
import {
  COUNTRY_RANK_BY_VALUES,
  COUNTRY_RANK_PROFILES
  
} from "@/lib/country-rank"
import type {CountryRankBy} from "@/lib/country-rank";

import { SORT_ORDERS } from "@/lib/leaderboard-search-params"

const shallowLoaderOptions = { shallow: false } as const

export const countriesSearchParams = {
  rankBy: parseAsStringLiteral(COUNTRY_RANK_BY_VALUES)
    .withDefault(COUNTRY_RANK_PROFILES)
    .withOptions(shallowLoaderOptions),
  order: parseAsStringLiteral(SORT_ORDERS)
    .withDefault("desc")
    .withOptions(shallowLoaderOptions),
}

export const countriesSearchSchema = createStandardSchemaV1(
  countriesSearchParams,
  { partialOutput: true },
)

export type CountriesSearch = inferParserType<typeof countriesSearchParams>

export function toCountriesSearch(
  search: Partial<CountriesSearch>,
): { rankBy: CountryRankBy; order: SortOrder } {
  return {
    rankBy: search.rankBy ?? COUNTRY_RANK_PROFILES,
    order: search.order ?? "desc",
  }
}
