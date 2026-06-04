import { Prisma } from "@/generated/prisma/client"
import { errorResponse } from "@/server/lib/api-response"

const CONNECTION_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "P1001",
  "P1017",
  "P2021",
])

function collectErrors(error: unknown): unknown[] {
  const chain: unknown[] = [error]
  if (error instanceof Error && error.cause) {
    chain.push(error.cause)
  }
  return chain
}

export function isMissingSchemaError(error: unknown): boolean {
  for (const item of collectErrors(error)) {
    if (
      item instanceof Prisma.PrismaClientKnownRequestError &&
      item.code === "P2021"
    ) {
      return true
    }
    const message = item instanceof Error ? item.message : String(item)
    if (
      message.includes("LeaderboardEntry") &&
      message.includes("does not exist")
    ) {
      return true
    }
  }
  return false
}

export function handleDbError(error: unknown): Response | null {
  for (const item of collectErrors(error)) {
    if (item instanceof Prisma.PrismaClientKnownRequestError) {
      if (item.code === "P2021") {
        return errorResponse(503, "Database schema not initialized", {
          hint: "Run: pnpm db:migrate:deploy",
          code: item.code,
        })
      }
      if (CONNECTION_ERROR_CODES.has(item.code)) {
        return errorResponse(503, "Database unavailable", {
          code: item.code,
        })
      }
    }

    const message = item instanceof Error ? item.message : String(item)
    if (
      message.includes("DATABASE_URL is not set") ||
      message.includes("ECONNREFUSED") ||
      message.includes("Can't reach database") ||
      message.includes("Connection terminated") ||
      message.includes("does not exist")
    ) {
      return errorResponse(503, "Database unavailable", { detail: message })
    }
  }

  return null
}
