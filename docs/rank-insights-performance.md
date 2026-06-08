# Rank Insights Performance Verification

Checklist for release verification (Phase 6).

## Standing card

- [x] Bounded to one handle per request (`STANDING_CARD_MAX_QUERIES = 7`).
- [x] Not rendered for every leaderboard row — only join success and single search match.
- [x] Uses indexed rank count queries via `getListPositionForEntry`.

## Leaderboard table

- [x] No per-row rank fanout — ranks come from paginated loader only.
- [x] Derived insights computed client-side from loaded `EntryDto` fields.

## Country / model pages

- [x] Served from `CountryDetailCache` and `ModelStatsCache` (24h TTL).
- [x] Recompute runs offline on cache miss or stale TTL, not per row.
- [x] Cache invalidated on new entry submit alongside existing stats caches.

## Indexed metrics

- [x] `longestAgentHours` index added for sortable longest-agent metric.
- [x] `INDEXED_LEADERBOARD_METRICS` documents supported rank columns.

## Tests

- `src/lib/entry-insights.test.ts` — derived metrics and milestone logic.
- `src/server/services/rank-insights-cache.test.ts` — cache serialization and TTL.

Run before release:

```bash
pnpm test
pnpm typecheck
pnpm build
```
