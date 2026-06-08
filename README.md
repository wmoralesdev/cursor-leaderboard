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
| `prisma.config.ts` | Direct DB URL for CLI (`DIRECT_URL` or derived from pooled `DATABASE_URL`) |
| `src/generated/prisma/` | Generated client (do not edit) |
| `src/server/db/prisma.ts` | Singleton client with `@prisma/adapter-pg` |

```bash
# Re-scrape stored profiles (bypasses API cooldown; needs DATABASE_URL in .env)
pnpm rescrape jpl
pnpm rescrape https://cursor.com/@jpl
pnpm rescrape --all
pnpm rescrape --all --delay-ms=1000
pnpm rescrape --due --limit=50   # rows older than SCRAPE_MAX_AGE_HOURS (default 24h)

pnpm db:generate        # Regenerate client after schema changes
pnpm db:migrate         # Create/apply migrations (dev)
pnpm db:migrate:deploy  # Apply migrations (CI/production)
pnpm db:status          # Check migration state vs Neon
pnpm db:studio          # Browse data in Prisma Studio
```

## SEO

Set `VITE_SITE_URL` in `.env` to your production origin (no trailing slash) so canonical URLs, Open Graph, `/robots.txt`, and `/sitemap.xml` use absolute links. Dev builds emit `noindex` automatically.

## Deploy

The app supports **Vercel** (Nitro) and **Netlify** (`@netlify/vite-plugin-tanstack-start`). Set `DEPLOY_TARGET` so the Vite config loads the right host plugin.

| Platform | Build command | Output |
|----------|---------------|--------|
| Vercel | `pnpm build:vercel` | `.vercel/output` (via Nitro) |
| Netlify | `pnpm build:netlify` | `dist/client` |

**Environment variables** (both hosts): `DATABASE_URL` (Neon pooled URL for runtime), optional `DIRECT_URL` (direct Neon URL for Prisma CLI — auto-derived from pooled `DATABASE_URL` on Netlify builds), optional `VITE_SITE_URL`, `SCRAPE_COOLDOWN_MINUTES`, `SCRAPE_USER_AGENT`.

**Proactive rescrape** (background job, not the Netlify app): `SCRAPE_MAX_AGE_HOURS` (default `24`), `SCRAPE_ERROR_RETRY_HOURS` (default `1` for `parse_error` rows), `SCRAPE_BATCH_LIMIT` (default `50`). User-initiated refresh still uses `SCRAPE_COOLDOWN_MINUTES` (default `15`).

## Scheduled rescrape (GitHub Actions)

Hourly workflow [`.github/workflows/rescrape.yml`](.github/workflows/rescrape.yml) runs `pnpm rescrape --due` against Neon so all stored profiles stay within `SCRAPE_MAX_AGE_HOURS` without Netlify function timeouts.

1. In the GitHub repo, add secret **`DATABASE_URL`** (Neon pooled or direct URL).
2. Optional repository variables: `SCRAPE_MAX_AGE_HOURS`, `SCRAPE_BATCH_LIMIT`, `SCRAPE_ERROR_RETRY_HOURS`.
3. Trigger manually via **Actions → Rescrape due profiles → Run workflow**, or wait for the hourly cron.

Each run processes up to 50 oldest due profiles (~25s at 500ms delay). Increase cron frequency or `SCRAPE_BATCH_LIMIT` as the leaderboard grows.

- **Vercel**: `vercel.json` runs `build:vercel`. Add the same env vars in the project settings.
- **Netlify**: `netlify.toml` runs `build:netlify` only. Apply schema changes locally with `pnpm db:migrate:deploy` before deploy. Requires Netlify CLI ≥ 17.31 for the TanStack Start plugin.

```bash
# Netlify (preview / production)
npx netlify deploy
npx netlify deploy --prod

# Vercel (preview / production)
npx vercel
npx vercel --prod
```

Local dev uses `pnpm dev` without a host plugin.

## Scripts

- `pnpm dev` — dev server (port 3000)
- `pnpm build:vercel` / `pnpm build:netlify` — production build for each host
- `pnpm rescrape` — dev/ops CLI to re-fetch cursor.com stats (`--due` for 24h proactive refresh)
- `pnpm test` — parser/unit tests
- `pnpm typecheck` — TypeScript

## Stack

- TanStack Start server routes (`src/routes/api/*`)
- Prisma 7 + `@prisma/adapter-pg` on Neon
- Cheerio HTML parser for public profile pages
