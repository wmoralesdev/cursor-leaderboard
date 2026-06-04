# Cursor Leaderboard

TanStack Start app with a backend API that ingests public Cursor profiles (`cursor.com/@handle`), stores stats in Neon Postgres via Prisma, and serves ranked leaderboard data.

## Setup

1. Copy env template and set your Neon connection string (or use Neon MCP / console):

```bash
cp .env.example .env
```

Neon project for this repo: **cursor-leaderboard** (`purple-band-49671931`, database `neondb`, branch `main`).

2. Apply migrations (required once per Neon database):

```bash
pnpm db:migrate:deploy
# or interactively in dev:
pnpm db:migrate
```

Confirm with `pnpm db:status` — should say **Database schema is up to date!**

3. Start the dev server (restart after any `.env` change):

```bash
pnpm dev
```

Optional: `pnpm db:push` instead of migrate during early experiments.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/entries` | Submit handle + country, scrape profile, upsert row |
| `GET` | `/api/entries/:handle` | Fetch stored entry |
| `POST` | `/api/entries/:handle/refresh` | Re-scrape (15 min cooldown per handle) |
| `GET` | `/api/leaderboard` | Ranked list (`?metric=agents&country=SV&limit=50`) |

### Example requests

```bash
# Health
curl -s http://localhost:3000/api/health

# Register / refresh stats from cursor.com
curl -s -X POST http://localhost:3000/api/entries \
  -H "Content-Type: application/json" \
  -d '{"handle":"wmoralesdev","country":"SV"}'

# Leaderboard (global, by agents)
curl -s "http://localhost:3000/api/leaderboard?metric=agents&limit=20"

# Per-country board
curl -s "http://localhost:3000/api/leaderboard?metric=tokens&country=SV"
```

Metrics: `agents` (default), `tokens`, `currentStreak`, `longestStreak`.

## Prisma

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Schema + `LeaderboardEntry` model |
| `prisma.config.ts` | `DATABASE_URL` + migrations path |
| `src/generated/prisma/` | Generated client (do not edit) |
| `src/server/db/prisma.ts` | Singleton client with `@prisma/adapter-pg` |

```bash
pnpm db:generate        # Regenerate client after schema changes
pnpm db:migrate         # Create/apply migrations (dev)
pnpm db:migrate:deploy  # Apply migrations (CI/production)
pnpm db:status          # Check migration state vs Neon
pnpm db:studio          # Browse data in Prisma Studio
```

## SEO

Set `VITE_SITE_URL` in `.env` to your production origin (no trailing slash) so canonical URLs, Open Graph, `/robots.txt`, and `/sitemap.xml` use absolute links. Dev builds emit `noindex` automatically.

## Scripts

- `pnpm dev` — dev server (port 3000)
- `pnpm test` — parser/unit tests
- `pnpm typecheck` — TypeScript

## Stack

- TanStack Start server routes (`src/routes/api/*`)
- Prisma 7 + `@prisma/adapter-pg` on Neon
- Cheerio HTML parser for public profile pages
