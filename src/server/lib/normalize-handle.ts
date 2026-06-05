const HANDLE_PATTERN = /^[a-zA-Z0-9_-]{1,39}$/

export class InvalidHandleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidHandleError"
  }
}

export function normalizeHandle(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new InvalidHandleError("Handle is required")
  }

  let candidate = trimmed

  try {
    if (candidate.includes("cursor.com")) {
      const url = new URL(candidate.startsWith("http") ? candidate : `https://${candidate}`)
      const match = url.pathname.match(/^\/@([^/]+)\/?$/)
      if (match?.[1]) {
        candidate = match[1]
      }
    }
  } catch {
    // Fall through to @-prefix stripping
  }

  if (candidate.startsWith("@")) {
    candidate = candidate.slice(1)
  }

  candidate = candidate.toLowerCase()

  if (!HANDLE_PATTERN.test(candidate)) {
    throw new InvalidHandleError(
      "Handle must be 1–39 alphanumeric characters, underscores, or dashes",
    )
  }

  return candidate
}

export function profileUrlForHandle(handle: string): string {
  return `https://cursor.com/@${handle}`
}
