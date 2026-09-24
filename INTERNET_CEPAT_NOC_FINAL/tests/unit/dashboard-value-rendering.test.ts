import { describe, expect, it } from "vitest"
import { formatDashboardValue } from "@/components/shared/dashboard-value"

describe("dashboard value rendering", () => {
  it("keeps supported scalar values readable", () => {
    expect(formatDashboardValue("Jakarta")).toBe("Jakarta")
    expect(formatDashboardValue("")).toBe("—")
    expect(formatDashboardValue("   ")).toBe("—")
    expect(formatDashboardValue(125000)).toBe("125000")
    expect(formatDashboardValue(0)).toBe("0")
    expect(formatDashboardValue(true)).toBe("Ya")
    expect(formatDashboardValue(false)).toBe("Tidak")
    expect(formatDashboardValue(new Date("2026-09-24T00:00:00.000Z"))).toBe("24/09/2026")
    expect(formatDashboardValue(new Date("invalid"))).toBe("—")
  })

  it("summarizes nested API values without exposing their JavaScript representation", () => {
    expect(formatDashboardValue(null)).toBe("—")
    expect(formatDashboardValue(undefined)).toBe("—")
    expect(formatDashboardValue([])).toBe("0 data")
    expect(formatDashboardValue(["Jakarta"])).toBe("1 data")
    expect(formatDashboardValue(["Jakarta", "Bandung"])).toBe("2 data")
    expect(formatDashboardValue([{ id: 1 }, { id: 2 }])).toBe("2 data")
    expect(formatDashboardValue([[1, 2], [3, 4]])).toBe("2 data")
    expect(formatDashboardValue({})).toBe("Data tersedia")
    expect(formatDashboardValue({ location: { latitude: -6.2 } })).toBe("Data tersedia")
  })

  it("replaces invalid and unsupported values with the empty state", () => {
    expect(formatDashboardValue(Number.NaN)).toBe("—")
    expect(formatDashboardValue(Number.POSITIVE_INFINITY)).toBe("—")
    expect(formatDashboardValue(Symbol("cid"))).toBe("—")
    expect(formatDashboardValue(1n)).toBe("—")
    expect(formatDashboardValue(() => "unsafe")).toBe("—")
    expect(formatDashboardValue(new Map())).toBe("—")
  })

  it("uses the same safe fallback for Site, CID, Upgrade, and Maintenance tables", () => {
    expect(formatDashboardValue("NOC-DEMO-JKT-01")).toBe("NOC-DEMO-JKT-01")
    expect(formatDashboardValue(false)).toBe("Tidak")
    expect(formatDashboardValue(["100 Mbps", "200 Mbps"])).toBe("2 data")
    expect(formatDashboardValue({ scheduled_at: "2026-10-05" })).toBe("Data tersedia")
  })
  it("preserves shared table prefix and date formatting", () => {
    expect(formatDashboardValue(12, { prefix: "MNT-" })).toBe("MNT-0012")
    expect(formatDashboardValue("2026-09-24", { type: "date" })).toBe("24/09/2026")
  })
})