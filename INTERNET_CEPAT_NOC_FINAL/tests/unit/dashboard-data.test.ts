import { describe, expect, it } from "vitest"
import {
  buildActionItems,
  buildRecentRecords,
  buildStatusDistribution,
  formatDashboardDate,
} from "@/app/dashboard/dashboard-data"

describe("dashboard view-model helpers", () => {
  it("keeps known and unknown status counts visible with safe labels", () => {
    expect(buildStatusDistribution([
      { status: "Aktif", count: 2 },
      { status: null, count: 1 },
    ])).toEqual([
      { label: "Aktif", count: 2 },
      { label: "Tidak ditentukan", count: 1 },
    ])
  })

  it("lists operational actions only when their verified counts are non-zero", () => {
    expect(buildActionItems({ fabsOpen: 2, upgradesRequested: 0, maintenanceScheduled: 1 }))
      .toEqual([
        { label: "FAB terbuka", count: 2, href: "/dashboard/fabs" },
        { label: "Maintenance terjadwal", count: 1, href: "/dashboard/maintenance" },
      ])
  })

  it("merges real recent records, sorts them, and safely handles unusable timestamps", () => {
    const records = buildRecentRecords([
      { id: "site-1", module: "sites", label: "Jakarta Core", status: "Aktif", updatedAt: "2026-10-03T00:00:00.000Z" },
      { id: "fab-1", module: "fabs", label: "FAB-001", status: "Open", updatedAt: "2026-10-05T00:00:00.000Z" },
      { id: "cid-1", module: "cids", label: "CID-001", status: null, updatedAt: "not-a-date" },
    ])

    expect(records.map((record) => record.id)).toEqual(["fab-1", "site-1", "cid-1"])
    expect(records.at(-1)?.updatedAtLabel).toBe("—")
  })

  it("limits the recent feed to eight records", () => {
    const records = Array.from({ length: 9 }, (_, index) => ({
      id: `site-${index}`,
      module: "sites" as const,
      label: `Site ${index}`,
      status: "Aktif",
      updatedAt: `2026-10-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`,
    }))

    expect(buildRecentRecords(records)).toHaveLength(8)
  })

  it("never emits an invalid dashboard date", () => {
    expect(formatDashboardDate("not-a-date")).toBe("—")
  })
})