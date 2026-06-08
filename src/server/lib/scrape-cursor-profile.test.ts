import { brotliCompressSync } from "node:zlib"
import { describe, expect, it } from "vitest"
import { decodeProfileResponseBody } from "@/server/lib/scrape-cursor-profile"

describe("decodeProfileResponseBody", () => {
  it("returns plain HTML unchanged", () => {
    const html = "<!DOCTYPE html><html><body>Agents</body></html>"
    expect(decodeProfileResponseBody(Buffer.from(html))).toBe(html)
  })

  it("decompresses raw Brotli when HTML is not readable", () => {
    const html = `<!DOCTYPE html><html><body>
      <h1>Walter Morales</h1>
      <span>Agents</span><span>100</span>
      <span>Tokens</span><span>1B</span>
      <span>Longest Streak</span><span>10d</span>
    </body></html>`
    const compressed = brotliCompressSync(Buffer.from(html))
    const decoded = decodeProfileResponseBody(compressed)
    expect(decoded).toContain("Agents")
    expect(decoded).toContain("Walter Morales")
  })
})
