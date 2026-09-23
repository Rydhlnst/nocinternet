import { NextRequest, NextResponse } from "next/server"
import { and, count, desc, eq, ilike, isNull, or } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { auditLogs, tableMap, cids as cidTable, sites as sitesTable, upgrades as upgradesTable, maintenance as maintenanceTable } from "@/lib/db/schema"
import { schemas, siteSchema } from "@/lib/validation"
import { describeApiError } from "@/lib/api-error"
import type { Resource } from "@/lib/types"

const resources: Resource[] = ["sites", "cids", "fabs", "upgrades", "maintenance"]
const SEARCH_COLS: Record<Exclude<Resource, "cids" | "upgrades" | "maintenance">, string[]> = {
  sites: ["namaSite", "siteId", "provinsi", "kotaKabupaten"],
  fabs: ["fabNumber", "pic"],
}
const STATUS_COL: Record<Resource, string> = {
  sites: "statusLayanan", cids: "status", fabs: "status", upgrades: "status", maintenance: "status",
}
function snakeToCamel(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, val]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), val])) }
function camelToSnake(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, val]) => [key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), val])) }
function validResource(value: string): value is Resource { return resources.includes(value as Resource) }

export async function GET(request: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params
  if (!validResource(resource)) return NextResponse.json({ error: "Modul tidak ditemukan. Pilih modul NOC yang tersedia." }, { status: 404 })
  try {
    const { db } = await requireUser()
    const q = request.nextUrl.searchParams.get("q") ?? ""
    const status = request.nextUrl.searchParams.get("status") ?? ""
    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(5, parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10)))
    const offset = (page - 1) * limit

    if (resource === "cids") {
      const serviceType = request.nextUrl.searchParams.get("service_type") ?? ""
      const provinsi = request.nextUrl.searchParams.get("provinsi") ?? ""
      const searchWhere = q ? or(
        ilike(cidTable.cidNumber, `%${q}%`),
        ilike(cidTable.customer, `%${q}%`),
        ilike(cidTable.ipAddress, `%${q}%`),
        ilike(sitesTable.siteId, `%${q}%`),
        ilike(sitesTable.namaSite, `%${q}%`),
      ) : undefined
      const statusWhere = status ? eq(cidTable.status, status) : undefined
      const serviceTypeWhere = serviceType ? eq(cidTable.serviceType, serviceType) : undefined
      const provinsiWhere = provinsi ? eq(sitesTable.provinsi, provinsi) : undefined
      const baseWhere = isNull(cidTable.archivedAt)
      const where = and(baseWhere, searchWhere, statusWhere, serviceTypeWhere, provinsiWhere)
      const kpiWhere = and(baseWhere, searchWhere, serviceTypeWhere, provinsiWhere)
      const cidCols = { id: cidTable.id, site_id: cidTable.siteId, status: cidTable.status, pic: cidTable.pic, notes: cidTable.notes, cid_number: cidTable.cidNumber, customer: cidTable.customer, service_type: cidTable.serviceType, bandwidth: cidTable.bandwidth, vlan: cidTable.vlan, ip_address: cidTable.ipAddress, activation_date: cidTable.activationDate, created_at: cidTable.createdAt, updated_at: cidTable.updatedAt, site_code: sitesTable.siteId, site_name: sitesTable.namaSite, provinsi: sitesTable.provinsi }
      const join = () => db.select(cidCols).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id))
      const [rows, [countRow], statusRows, serviceTypeRows, provinsiRows] = await Promise.all([
        join().where(where).orderBy(desc(cidTable.createdAt)).limit(limit).offset(offset),
        db.select({ value: count() }).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id)).where(where),
        db.select({ s: cidTable.status, n: count() }).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id)).where(kpiWhere).groupBy(cidTable.status),
        db.select({ s: cidTable.serviceType, n: count() }).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id)).where(kpiWhere).groupBy(cidTable.serviceType),
        db.select({ s: sitesTable.provinsi, n: count() }).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id)).where(kpiWhere).groupBy(sitesTable.provinsi),
      ])
      const total = Number(countRow?.value ?? 0)
      const statusCounts = Object.fromEntries((statusRows as { s: unknown; n: unknown }[]).map(r => [String(r.s), Number(r.n)]))
      const filterCounts = {
        service_type: Object.fromEntries((serviceTypeRows as { s: unknown; n: unknown }[]).filter(r => r.s != null).map(r => [String(r.s), Number(r.n)])),
        provinsi: Object.fromEntries((provinsiRows as { s: unknown; n: unknown }[]).filter(r => r.s != null).map(r => [String(r.s), Number(r.n)])),
      }
      return NextResponse.json({ data: rows, total, page, limit, statusCounts, filterCounts })
    }

    if (resource === "upgrades") {
      const searchWhere = q ? or(
        ilike(upgradesTable.currentBandwidth, `%${q}%`),
        ilike(upgradesTable.requestedBandwidth, `%${q}%`),
        ilike(upgradesTable.pic, `%${q}%`),
        ilike(cidTable.cidNumber, `%${q}%`),
        ilike(cidTable.customer, `%${q}%`),
        ilike(sitesTable.namaSite, `%${q}%`),
      ) : undefined
      const statusWhere = status ? eq(upgradesTable.status, status) : undefined
      const baseWhere = isNull(upgradesTable.archivedAt)
      const where = and(baseWhere, searchWhere, statusWhere)
      const kpiWhere = and(baseWhere, searchWhere)
      const upgCols = { id: upgradesTable.id, site_id: upgradesTable.siteId, cid_id: upgradesTable.cidId, status: upgradesTable.status, pic: upgradesTable.pic, notes: upgradesTable.notes, current_bandwidth: upgradesTable.currentBandwidth, requested_bandwidth: upgradesTable.requestedBandwidth, request_date: upgradesTable.requestDate, target_date: upgradesTable.targetDate, completion_date: upgradesTable.completionDate, created_at: upgradesTable.createdAt, updated_at: upgradesTable.updatedAt, cid_number: cidTable.cidNumber, customer: cidTable.customer, site_name: sitesTable.namaSite, site_code: sitesTable.siteId }
      const join = () => db.select(upgCols).from(upgradesTable).leftJoin(cidTable, eq(upgradesTable.cidId, cidTable.id)).leftJoin(sitesTable, eq(upgradesTable.siteId, sitesTable.id))
      const [rows, [countRow], statusRows] = await Promise.all([
        join().where(where).orderBy(desc(upgradesTable.createdAt)).limit(limit).offset(offset),
        db.select({ value: count() }).from(upgradesTable).leftJoin(cidTable, eq(upgradesTable.cidId, cidTable.id)).leftJoin(sitesTable, eq(upgradesTable.siteId, sitesTable.id)).where(where),
        db.select({ s: upgradesTable.status, n: count() }).from(upgradesTable).where(kpiWhere).groupBy(upgradesTable.status),
      ])
      const total = Number(countRow?.value ?? 0)
      const statusCounts = Object.fromEntries((statusRows as { s: unknown; n: unknown }[]).map(r => [String(r.s), Number(r.n)]))
      return NextResponse.json({ data: rows, total, page, limit, statusCounts })
    }

    if (resource === "maintenance") {
      const maintenanceType = request.nextUrl.searchParams.get("maintenance_type") ?? ""
      const impact = request.nextUrl.searchParams.get("impact") ?? ""
      const searchWhere = q ? or(
        ilike(maintenanceTable.maintenanceType, `%${q}%`),
        ilike(maintenanceTable.picVendor, `%${q}%`),
        ilike(maintenanceTable.impact, `%${q}%`),
        ilike(cidTable.cidNumber, `%${q}%`),
        ilike(cidTable.customer, `%${q}%`),
        ilike(sitesTable.namaSite, `%${q}%`),
      ) : undefined
      const statusWhere = status ? eq(maintenanceTable.status, status) : undefined
      const typeWhere = maintenanceType ? eq(maintenanceTable.maintenanceType, maintenanceType) : undefined
      const impactWhere = impact ? eq(maintenanceTable.impact, impact) : undefined
      const baseWhere = isNull(maintenanceTable.archivedAt)
      const where = and(baseWhere, searchWhere, statusWhere, typeWhere, impactWhere)
      const kpiWhere = and(baseWhere, searchWhere, typeWhere, impactWhere)
      const mntCols = { id: maintenanceTable.id, no: maintenanceTable.no, site_id: maintenanceTable.siteId, cid_id: maintenanceTable.cidId, status: maintenanceTable.status, pic: maintenanceTable.pic, notes: maintenanceTable.notes, maintenance_type: maintenanceTable.maintenanceType, scheduled_at: maintenanceTable.scheduledAt, started_at: maintenanceTable.startedAt, completed_at: maintenanceTable.completedAt, impact: maintenanceTable.impact, pic_vendor: maintenanceTable.picVendor, created_at: maintenanceTable.createdAt, updated_at: maintenanceTable.updatedAt, cid_number: cidTable.cidNumber, customer: cidTable.customer, site_name: sitesTable.namaSite, site_code: sitesTable.siteId }
      const join = () => db.select(mntCols).from(maintenanceTable).leftJoin(cidTable, eq(maintenanceTable.cidId, cidTable.id)).leftJoin(sitesTable, eq(maintenanceTable.siteId, sitesTable.id))
      const [rows, [countRow], statusRows, typeRows, impactRows] = await Promise.all([
        join().where(where).orderBy(desc(maintenanceTable.createdAt)).limit(limit).offset(offset),
        db.select({ value: count() }).from(maintenanceTable).leftJoin(cidTable, eq(maintenanceTable.cidId, cidTable.id)).leftJoin(sitesTable, eq(maintenanceTable.siteId, sitesTable.id)).where(where),
        db.select({ s: maintenanceTable.status, n: count() }).from(maintenanceTable).where(kpiWhere).groupBy(maintenanceTable.status),
        db.select({ s: maintenanceTable.maintenanceType, n: count() }).from(maintenanceTable).where(kpiWhere).groupBy(maintenanceTable.maintenanceType),
        db.select({ s: maintenanceTable.impact, n: count() }).from(maintenanceTable).where(kpiWhere).groupBy(maintenanceTable.impact),
      ])
      const total = Number(countRow?.value ?? 0)
      const statusCounts = Object.fromEntries((statusRows as { s: unknown; n: unknown }[]).map(r => [String(r.s), Number(r.n)]))
      const filterCounts = {
        maintenance_type: Object.fromEntries((typeRows as { s: unknown; n: unknown }[]).filter(r => r.s != null).map(r => [String(r.s), Number(r.n)])),
        impact: Object.fromEntries((impactRows as { s: unknown; n: unknown }[]).filter(r => r.s != null).map(r => [String(r.s), Number(r.n)])),
      }
      return NextResponse.json({ data: rows, total, page, limit, statusCounts, filterCounts })
    }

    const table = tableMap[resource] as any
    const sCol = STATUS_COL[resource]
    const searchWhere = q ? or(...SEARCH_COLS[resource as Exclude<Resource, "cids" | "upgrades" | "maintenance">].map((c: string) => ilike(table[c], `%${q}%`))) : undefined
    const statusWhere = status ? eq(table[sCol], status) : undefined
    const baseWhere = isNull(table.archivedAt)
    const where = and(baseWhere, searchWhere, statusWhere)
    const kpiWhere = and(baseWhere, searchWhere)
    const [rows, [countRow], statusRows] = await Promise.all([
      db.select().from(table).where(where).orderBy(desc(table.createdAt)).limit(limit).offset(offset),
      db.select({ value: count() }).from(table).where(where),
      db.select({ s: table[sCol], n: count() }).from(table).where(kpiWhere).groupBy(table[sCol]),
    ])
    const total = Number(countRow?.value ?? 0)
    const statusCounts = Object.fromEntries((statusRows as { s: unknown; n: unknown }[]).map(r => [String(r.s), Number(r.n)]))
    return NextResponse.json({ data: (rows as Record<string, unknown>[]).map(camelToSnake), total, page, limit, statusCounts })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "Data gagal dimuat. Coba lagi beberapa saat.") }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params; if (!validResource(resource)) return NextResponse.json({ error: "Modul tidak ditemukan. Pilih modul NOC yang tersedia." }, { status: 404 })
  try { const { db, user } = await requireUser(); const body = await request.json(); const parsed = resource === "sites" ? siteSchema.safeParse(body) : schemas[resource].safeParse(body); if (!parsed.success) return NextResponse.json({ error: "Data belum sesuai", details: parsed.error.flatten() }, { status: 400 }); const table = tableMap[resource] as any; const result = await db.insert(table).values(snakeToCamel(parsed.data) as any).returning(); const data = (Array.isArray(result) ? result[0] : undefined) as Record<string, unknown> | undefined; if (!data) return NextResponse.json({ error: "Data gagal disimpan. Periksa field wajib." }, { status: 400 }); await db.insert(auditLogs).values({ userId: user.id, action: "create", module: resource, recordId: data.id as string }); return NextResponse.json({ data: camelToSnake(data) }, { status: 201 }) } catch (error) { return NextResponse.json({ error: describeApiError(error, "Data gagal disimpan. Periksa kembali format dan field wajib.") }, { status: 400 }) }
}
