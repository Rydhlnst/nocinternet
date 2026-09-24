import { describe, expect, it } from "vitest"
import { formatDashboardValue } from "@/components/shared/dashboard-value"

describe("dashboard value rendering", () => {
  it("replaces nested values with human-readable summaries", () => {
    expect(formatDashboardValue(null)).toBe("—")
    expect(formatDashboardValue([])).toBe("—")
    expect(formatDashboardValue(["Jakarta", "Bandung"])).toBe("2 data")
    expect(formatDashboardValue({ latitude: -6.2, longitude: 106.8 })).toBe("Data tersedia")
  })
})
