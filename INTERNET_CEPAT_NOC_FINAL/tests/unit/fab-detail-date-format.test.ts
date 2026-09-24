import { describe, expect, it } from "vitest"
import { formatFabDetailDate } from "@/lib/fab-detail-formatters"

describe("formatFabDetailDate", () => {
  it("formats a date-only API value", () => {
    expect(formatFabDetailDate("2026-10-01")).toBe("1 Okt 2026")
  })

  it("formats a full ISO API timestamp without appending a second timezone suffix", () => {
    expect(formatFabDetailDate("2026-10-01T00:00:00.000Z")).toBe("1 Okt 2026")
  })

  it("uses a safe placeholder for missing or malformed dates", () => {
    expect(formatFabDetailDate(null)).toBe("—")
    expect(formatFabDetailDate("not-a-date")).toBe("—")
  })
})
