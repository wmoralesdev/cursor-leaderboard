import "dotenv/config"

import { InvalidHandleError } from "@/server/lib/normalize-handle"
import {
  EntryNotFoundError,
  rescrapeAllEntries,
  rescrapeEntry,
} from "@/server/services/entries-service"

function printUsage(): void {
  console.log(`Usage:
  pnpm rescrape <handle|url> [more...]   Re-scrape one or more stored profiles
  pnpm rescrape --all                    Re-scrape every row in the database
  pnpm rescrape --all --delay-ms=1000    Pause between profiles (default 500)

Examples:
  pnpm rescrape jpl
  pnpm rescrape https://cursor.com/@jpl
  pnpm rescrape --all`)
}

function parseDelayMs(args: string[]): number | undefined {
  const flag = args.find((a) => a.startsWith("--delay-ms="))
  if (!flag) return undefined
  const value = Number.parseInt(flag.slice("--delay-ms=".length), 10)
  return Number.isFinite(value) && value >= 0 ? value : undefined
}

async function rescrapeHandles(handles: string[]): Promise<number> {
  let failed = 0

  for (const raw of handles) {
    try {
      const entry = await rescrapeEntry(raw)
      const status = entry.scrapeStatus
      const agents = entry.agentsTotal
      const tokens = entry.tokensTotal.toString()
      console.log(
        `[rescrape] @${entry.handle} ${status} agents=${agents} tokens=${tokens}`,
      )
      if (status !== "ok" && entry.scrapeError) {
        console.error(`  detail: ${entry.scrapeError}`)
        failed += 1
      }
    } catch (error) {
      failed += 1
      if (error instanceof InvalidHandleError) {
        console.error(`[rescrape] invalid handle "${raw}": ${error.message}`)
      } else if (error instanceof EntryNotFoundError) {
        console.error(
          `[rescrape] @${raw} not in database — submit via POST /api/entries first`,
        )
      } else {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`[rescrape] ${raw} failed: ${message}`)
      }
    }
  }

  return failed
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  if (argv.length === 0 || argv.includes("-h") || argv.includes("--help")) {
    printUsage()
    process.exit(argv.length === 0 ? 1 : 0)
  }

  const delayMs = parseDelayMs(argv)
  const positional = argv.filter((a) => !a.startsWith("--"))

  if (argv.includes("--all")) {
    const summary = await rescrapeAllEntries({ delayMs })
    console.log(
      `[rescrape] done ok=${summary.ok} failed=${summary.failed}`,
    )
    process.exit(summary.failed > 0 ? 1 : 0)
  }

  if (positional.length === 0) {
    printUsage()
    process.exit(1)
  }

  const failed = await rescrapeHandles(positional)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
