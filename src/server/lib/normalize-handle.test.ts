import { describe, expect, it } from "vitest"
import {
  InvalidHandleError,
  normalizeHandle,
  profileUrlForHandle,
} from "@/server/lib/normalize-handle"

describe("normalizeHandle", () => {
  it("normalizes common inputs", () => {
    expect(normalizeHandle("wmoralesdev")).toBe("wmoralesdev")
    expect(normalizeHandle("@wmoralesdev")).toBe("wmoralesdev")
    expect(normalizeHandle("https://cursor.com/@wmoralesdev")).toBe(
      "wmoralesdev",
    )
  })

  it("rejects invalid handles", () => {
    expect(() => normalizeHandle("")).toThrow(InvalidHandleError)
    expect(() => normalizeHandle("bad handle!")).toThrow(InvalidHandleError)
  })
})

describe("profileUrlForHandle", () => {
  it("builds profile url", () => {
    expect(profileUrlForHandle("wmoralesdev")).toBe(
      "https://cursor.com/@wmoralesdev",
    )
  })
})
