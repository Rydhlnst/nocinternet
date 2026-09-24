import { and, count, desc, eq, isNull } from "drizzle-orm"
import { getDb } from "@/lib/db"
import { cids, fabs, maintenance, sites, upgrades } from "@/lib/db/schema"
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
export type DashboardCounts = {
  sites: number
  sitesAktif: number
  cids: number
  cidsAktif: number
  fabs: number
  fabsOpen: number
  upgrades: number
  upgradesRequested: number
  maintenance: number
  maintenanceScheduled: number
}

export function buildDashboardKpis(counts: DashboardCounts): DashboardKpi[] {
  return [
    { module: "sites", label: dashboardModules.sites.label, total: counts.sites, contextLabel: "site aktif", contextValue: counts.sitesAktif, href: dashboardModules.sites.href },
    { module: "cids", label: dashboardModules.cids.label, total: counts.cids, contextLabel: "CID aktif", contextValue: counts.cidsAktif, href: dashboardModules.cids.href },
    { module: "fabs", label: dashboardModules.fabs.label, total: counts.fabs, contextLabel: "FAB terbuka", contextValue: counts.fabsOpen, href: dashboardModules.fabs.href },
    { module: "upgrades", label: dashboardModules.upgrades.label, total: counts.upgrades, contextLabel: "permintaan", contextValue: counts.upgradesRequested, href: dashboardModules.upgrades.href },
    { module: "maintenance", label: dashboardModules.maintenance.label, total: counts.maintenance, contextLabel: "terjadwal", contextValue: counts.maintenanceScheduled, href: dashboardModules.maintenance.href },
  ]
}

export async function getDashboardViewModel(db: ReturnType<typeof getDb>): Promise<DashboardViewModel> {
  const [
    [sitesTotal], [sitesAktif], [cidsTotal], [cidsAktif], [fabsTotal], [fabsOpen], [upgradesTotal], [upgradesRequested], [maintenanceTotal], [maintenanceScheduled],
    siteStatuses, cidStatuses, fabStatuses, upgradeStatuses, maintenanceStatuses,
    siteRecent, cidRecent, fabRecent, upgradeRecent, maintenanceRecent,
  ] = await Promise.all([
    db.select({ value: count() }).from(sites).where(isNull(sites.archivedAt)),
    db.select({ value: count() }).from(sites).where(and(isNull(sites.archivedAt), eq(sites.statusLayanan, "Aktif"))),
    db.select({ value: count() }).from(cids).where(isNull(cids.archivedAt)),
    db.select({ value: count() }).from(cids).where(and(isNull(cids.archivedAt), eq(cids.status, "Aktif"))),
    db.select({ value: count() }).from(fabs).where(isNull(fabs.archivedAt)),
    db.select({ value: count() }).from(fabs).where(and(isNull(fabs.archivedAt), eq(fabs.status, "Open"))),
    db.select({ value: count() }).from(upgrades).where(isNull(upgrades.archivedAt)),
    db.select({ value: count() }).from(upgrades).where(and(isNull(upgrades.archivedAt), eq(upgrades.status, "Requested"))),
    db.select({ value: count() }).from(maintenance).where(isNull(maintenance.archivedAt)),
    db.select({ value: count() }).from(maintenance).where(and(isNull(maintenance.archivedAt), eq(maintenance.status, "Scheduled"))),
    db.select({ status: sites.statusLayanan, count: count() }).from(sites).where(isNull(sites.archivedAt)).groupBy(sites.statusLayanan),
    db.select({ status: cids.status, count: count() }).from(cids).where(isNull(cids.archivedAt)).groupBy(cids.status),
    db.select({ status: fabs.status, count: count() }).from(fabs).where(isNull(fabs.archivedAt)).groupBy(fabs.status),
    db.select({ status: upgrades.status, count: count() }).from(upgrades).where(isNull(upgrades.archivedAt)).groupBy(upgrades.status),
    db.select({ status: maintenance.status, count: count() }).from(maintenance).where(isNull(maintenance.archivedAt)).groupBy(maintenance.status),
    db.select({ id: sites.id, label: sites.namaSite, status: sites.statusLayanan, updatedAt: sites.updatedAt }).from(sites).where(isNull(sites.archivedAt)).orderBy(desc(sites.updatedAt)).limit(8),
    db.select({ id: cids.id, label: cids.cidNumber, status: cids.status, updatedAt: cids.updatedAt }).from(cids).where(isNull(cids.archivedAt)).orderBy(desc(cids.updatedAt)).limit(8),
    db.select({ id: fabs.id, label: fabs.fabNumber, status: fabs.status, updatedAt: fabs.updatedAt }).from(fabs).where(isNull(fabs.archivedAt)).orderBy(desc(fabs.updatedAt)).limit(8),
    db.select({ id: upgrades.id, currentBandwidth: upgrades.currentBandwidth, requestedBandwidth: upgrades.requestedBandwidth, status: upgrades.status, updatedAt: upgrades.updatedAt }).from(upgrades).where(isNull(upgrades.archivedAt)).orderBy(desc(upgrades.updatedAt)).limit(8),
    db.select({ id: maintenance.id, label: maintenance.maintenanceType, status: maintenance.status, updatedAt: maintenance.updatedAt }).from(maintenance).where(isNull(maintenance.archivedAt)).orderBy(desc(maintenance.updatedAt)).limit(8),
  ])

  const counts: DashboardCounts = {
    sites: Number(sitesTotal?.value ?? 0), sitesAktif: Number(sitesAktif?.value ?? 0),
    cids: Number(cidsTotal?.value ?? 0), cidsAktif: Number(cidsAktif?.value ?? 0),
    fabs: Number(fabsTotal?.value ?? 0), fabsOpen: Number(fabsOpen?.value ?? 0),
    upgrades: Number(upgradesTotal?.value ?? 0), upgradesRequested: Number(upgradesRequested?.value ?? 0),
    maintenance: Number(maintenanceTotal?.value ?? 0), maintenanceScheduled: Number(maintenanceScheduled?.value ?? 0),
  }

  return {
    loadedAt: new Date(),
    kpis: buildDashboardKpis(counts),
    distributions: [
      { module: "sites", label: dashboardModules.sites.label, items: buildStatusDistribution(siteStatuses) },
      { module: "cids", label: dashboardModules.cids.label, items: buildStatusDistribution(cidStatuses) },
      { module: "fabs", label: dashboardModules.fabs.label, items: buildStatusDistribution(fabStatuses) },
      { module: "upgrades", label: dashboardModules.upgrades.label, items: buildStatusDistribution(upgradeStatuses) },
      { module: "maintenance", label: dashboardModules.maintenance.label, items: buildStatusDistribution(maintenanceStatuses) },
    ],
    actions: buildActionItems({ fabsOpen: counts.fabsOpen, upgradesRequested: counts.upgradesRequested, maintenanceScheduled: counts.maintenanceScheduled }),
    recentRecords: buildRecentRecords([
      ...siteRecent.map((row) => ({ ...row, module: "sites" as const })),
      ...cidRecent.map((row) => ({ ...row, module: "cids" as const })),
      ...fabRecent.map((row) => ({ ...row, module: "fabs" as const })),
      ...upgradeRecent.map((row) => ({ id: row.id, module: "upgrades" as const, label: `${row.currentBandwidth} → ${row.requestedBandwidth}`, status: row.status, updatedAt: row.updatedAt })),
      ...maintenanceRecent.map((row) => ({ ...row, module: "maintenance" as const })),
    ]),
  }
}