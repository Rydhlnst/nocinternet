export type DashboardModule = "sites" | "cids" | "fabs" | "upgrades" | "maintenance"

export type DashboardKpi = {
  module: DashboardModule
  label: string
  total: number
  contextLabel: string
  contextValue: number
  href: string
}

export type DashboardStatusItem = { label: string; count: number }
export type DashboardStatusDistribution = { module: DashboardModule; label: string; items: DashboardStatusItem[] }
export type DashboardActionItem = { label: string; count: number; href: string }

type Timestamp = Date | string | null | undefined

export type DashboardRecentInput = {
  id: string
  module: DashboardModule
  label: string | null | undefined
  status: string | null | undefined
  updatedAt: Timestamp
}

export type DashboardRecentRecord = {
  id: string
  module: DashboardModule
  moduleLabel: string
  label: string
  statusLabel: string
  updatedAt: Date | null
  updatedAtLabel: string
  href: string
}

export type DashboardViewModel = {
  loadedAt: Date
  kpis: DashboardKpi[]
  distributions: DashboardStatusDistribution[]
  actions: DashboardActionItem[]
  recentRecords: DashboardRecentRecord[]
}

export const dashboardModules: Record<DashboardModule, { label: string; href: string }> = {
  sites: { label: "Site Database", href: "/dashboard/sites" },
  cids: { label: "CID Tracking", href: "/dashboard/cids" },
  fabs: { label: "FAB / SO", href: "/dashboard/fabs" },
  upgrades: { label: "Upgrade Bandwidth", href: "/dashboard/upgrades" },
  maintenance: { label: "Maintenance", href: "/dashboard/maintenance" },
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})

export function formatDashboardStatus(value: string | null | undefined): string {
  return value?.trim() || "Tidak ditentukan"
}

export function formatDashboardDate(value: Timestamp): string {
  const date = toDate(value)
  return date ? dateFormatter.format(date) : "—"
}

export function buildStatusDistribution(rows: Array<{ status: string | null; count: number }>): DashboardStatusItem[] {
  return rows.map((row) => ({ label: formatDashboardStatus(row.status), count: Number.isFinite(row.count) ? row.count : 0 }))
}

export function buildActionItems(counts: { fabsOpen: number; upgradesRequested: number; maintenanceScheduled: number }): DashboardActionItem[] {
  return [
    counts.fabsOpen > 0 ? { label: "FAB terbuka", count: counts.fabsOpen, href: dashboardModules.fabs.href } : null,
    counts.upgradesRequested > 0 ? { label: "Upgrade bandwidth diminta", count: counts.upgradesRequested, href: dashboardModules.upgrades.href } : null,
    counts.maintenanceScheduled > 0 ? { label: "Maintenance terjadwal", count: counts.maintenanceScheduled, href: dashboardModules.maintenance.href } : null,
  ].filter((item): item is DashboardActionItem => item !== null)
}

export function buildRecentRecords(records: DashboardRecentInput[]): DashboardRecentRecord[] {
  return records
    .map((record) => {
      const updatedAt = toDate(record.updatedAt)
      const module = dashboardModules[record.module]
      return {
        id: record.id,
        module: record.module,
        moduleLabel: module.label,
        label: record.label?.trim() || "Rekaman tanpa nama",
        statusLabel: formatDashboardStatus(record.status),
        updatedAt,
        updatedAtLabel: formatDashboardDate(updatedAt),
        href: module.href,
      }
    })
    .sort((left, right) => (right.updatedAt?.getTime() ?? Number.NEGATIVE_INFINITY) - (left.updatedAt?.getTime() ?? Number.NEGATIVE_INFINITY))
    .slice(0, 8)
}

function toDate(value: Timestamp): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}