# Scrape Snapshot Storage Plan

Future Rank Insights feature: movers and trends. Not in v1 scope.

## Goal

Store periodic snapshots of leaderboard stats so we can compute deltas offline without live history scans.

## Proposed schema

```prisma
model LeaderboardEntrySnapshot {
  id                 String   @id @default(cuid())
  handle             String
  snapshotDate       DateTime @db.Date
  agentsTotal        Int
  tokensTotal        BigInt
  currentStreakDays  Int
  longestStreakDays  Int
  longestAgentHours  Float
  scrapedAt          DateTime

  @@unique([handle, snapshotDate])
  @@index([snapshotDate])
  @@index([handle, snapshotDate(sort: Desc)])
}
```

## Retention

- Keep daily snapshots for 90 days.
- Optionally keep weekly rollups beyond 90 days for long-tail trends.
- Purge via scheduled job (GitHub Action or rescrape pipeline hook).

## Write path

- After successful `applyScrapeToEntry`, upsert today's snapshot for the handle.
- Batch during `pnpm rescrape --due` to avoid per-row overhead in hot paths.
- One snapshot per handle per UTC day (idempotent upsert).

## Read path

- Movers page reads precomputed delta rows, never raw snapshot history on request.
- Public API serves cached `MoversCache` refreshed hourly or on rescrape completion.

## Performance guardrails

- Never aggregate snapshots on user-facing requests.
- Index by `snapshotDate` for batch delta jobs.
- Cap mover lists (top 50 climbers) in cache payload.

## Rollout

1. Add schema + migration via Prisma CLI.
2. Backfill today's snapshot from current `LeaderboardEntry` rows.
3. Hook snapshot write into rescrape success path.
4. Add offline delta job (Phase 5 todo P5-002).
5. Ship movers UI only after cache exists.
