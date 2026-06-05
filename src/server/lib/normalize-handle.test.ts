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

  it("accepts underscores and dashes in handles", () => {
    expect(normalizeHandle("user_name")).toBe("user_name")
    expect(normalizeHandle("user-name")).toBe("user-name")
    expect(normalizeHandle("user_name-123")).toBe("user_name-123")
    expect(normalizeHandle("@user-name")).toBe("user-name")
    expect(normalizeHandle("https://cursor.com/@user_name")).toBe("user_name")
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
