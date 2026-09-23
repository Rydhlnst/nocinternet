import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { auditLogs, tableMap, cids as cidTable, sites as sitesTable } from "@/lib/db/schema"
import { schemas, siteSchema } from "@/lib/validation"
import { describeApiError } from "@/lib/api-error"
import type { Resource } from "@/lib/types"

const resources: Resource[] = ["sites", "cids", "fabs", "upgrades", "maintenance"]
function snakeToCamel(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, val]) => [key.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), val])) }
function camelToSnake(value: Record<string, unknown>) { return Object.fromEntries(Object.entries(value).map(([key, val]) => [key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), val])) }
function validResource(value: string): value is Resource { return resources.includes(value as Resource) }

export async function GET(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params
  if (!validResource(resource)) return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 })
  try {
    const { db } = await requireUser()
    if (resource === "cids") {
      const cidCols = { id: cidTable.id, site_id: cidTable.siteId, status: cidTable.status, pic: cidTable.pic, notes: cidTable.notes, cid_number: cidTable.cidNumber, customer: cidTable.customer, service_type: cidTable.serviceType, bandwidth: cidTable.bandwidth, vlan: cidTable.vlan, ip_address: cidTable.ipAddress, activation_date: cidTable.activationDate, created_at: cidTable.createdAt, updated_at: cidTable.updatedAt, site_code: sitesTable.siteId, site_name: sitesTable.namaSite, provinsi: sitesTable.provinsi }
      const [row] = await db.select(cidCols).from(cidTable).leftJoin(sitesTable, eq(cidTable.siteId, sitesTable.id)).where(eq(cidTable.id, id)).limit(1)
      if (!row) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 })
      return NextResponse.json({ data: row })
    }
    const table = tableMap[resource] as any
    const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1)
    if (!row) return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 })
    return NextResponse.json({ data: camelToSnake(row as Record<string, unknown>) })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "Data gagal dimuat.") }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params; if (!validResource(resource)) return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 })
  try { const { db, user } = await requireUser(); const parsed = (resource === "sites" ? siteSchema.partial() : schemas[resource].partial()).safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Data belum sesuai", details: parsed.error.flatten() }, { status: 400 }); const table = tableMap[resource] as any; const result = await db.update(table).set(snakeToCamel(parsed.data) as any).where(eq(table.id, id)).returning(); const data = (Array.isArray(result) ? result[0] : undefined) as Record<string, unknown> | undefined; if (!data) return NextResponse.json({ error: "Data tidak ditemukan atau sudah diarsipkan." }, { status: 404 }); await db.insert(auditLogs).values({ userId: user.id, action: "update", module: resource, recordId: id }); return NextResponse.json({ data: camelToSnake(data) }) } catch (error) { return NextResponse.json({ error: describeApiError(error, "Data gagal diperbarui. Periksa kembali input Anda.") }, { status: 400 }) }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params; if (!validResource(resource)) return NextResponse.json({ error: "Modul tidak ditemukan." }, { status: 404 })
  try { const { db, user } = await requireUser(); const table = tableMap[resource] as any; const result = await db.update(table).set({ archivedAt: new Date() }).where(eq(table.id, id)).returning({ id: table.id }); if (!result[0]) return NextResponse.json({ error: "Data tidak ditemukan atau sudah diarsipkan." }, { status: 404 }); await db.insert(auditLogs).values({ userId: user.id, action: "archive", module: resource, recordId: id }); return NextResponse.json({ ok: true }) } catch (error) { return NextResponse.json({ error: describeApiError(error, "Data gagal diarsipkan. Coba lagi.") }, { status: 400 }) }
}
