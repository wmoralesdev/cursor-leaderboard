# Offline Movers Computation Plan

Companion to [rank-insights-snapshots-plan.md](./rank-insights-snapshots-plan.md).

## Goal

Answer “who climbed this week?” from daily snapshots without live queries.

## Proposed cache

```prisma
model MoversCache {
  id          String   @id @default("global")
  windowDays  Int
  metric      String
  movers      Json
  computedAt  DateTime
}
```

`movers` JSON shape:

```ts
type MoverRow = {
  handle: string
  displayName: string | null
  country: string
  delta: number
  previous: number
  current: number
  rank: number
}
```

## Computation (offline)

Run after rescrape batch or on cron:

1. Load snapshots for `today` and `today - windowDays` (7 or 30).
2. Join on `handle`, compute delta per metric (`agentsTotal`, `tokensTotal`, streaks).
3. Filter to positive deltas and `scrapeStatus = ok` on current entry.
4. Sort by delta desc, take top 50.
5. Upsert `MoversCache` for each metric/window pair.

## SQL sketch

```sql
SELECT
  cur.handle,
  cur."agentsTotal" - prev."agentsTotal" AS delta
FROM "LeaderboardEntrySnapshot" cur
JOIN "LeaderboardEntrySnapshot" prev
  ON prev.handle = cur.handle
 AND prev."snapshotDate" = cur."snapshotDate" - INTERVAL '7 days'
WHERE cur."snapshotDate" = CURRENT_DATE
ORDER BY delta DESC
LIMIT 50;
```

## UI surface (future)

- `/movers` page with window toggle (7d / 30d) and metric tabs.
- Copy: “+120 agents this week” not raw snapshot tables.
- Link each row to standing card, not a duplicate profile page.

## Performance guardrails

- Single batch job; no per-request snapshot joins.
- Cache TTL aligned with rescrape cadence (hourly/daily).
- Invalidate movers cache when snapshot backfill runs.

## Dependencies

- Requires `LeaderboardEntrySnapshot` table (P5-001).
- Should run in GitHub Actions rescrape workflow after `--due` batch completes.
