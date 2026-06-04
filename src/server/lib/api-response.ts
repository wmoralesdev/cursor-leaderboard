export function jsonResponse(
  body: unknown,
  init?: ResponseInit,
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
}

export function errorResponse(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return jsonResponse({ error: message, ...extra }, { status })
}

export async function parseJsonBody<T>(
  request: Request,
): Promise<T | Response> {
  try {
    return (await request.json()) as T
  } catch {
    return errorResponse(400, "Invalid JSON body")
  }
}
