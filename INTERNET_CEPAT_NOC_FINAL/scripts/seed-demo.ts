import { loadEnvConfig } from "@next/env"

type SeedContext = {
  siteIds: { jakarta: string; bandung: string; surabaya: string }
  cidIds: { jakarta: string; bandung: string; surabaya: string }
}

function requireValid<T>(label: string, result: { success: true; data: T } | { success: false; error: { flatten: () => unknown } }): T {
  if (!result.success) throw new Error(`${label} demo data is invalid: ${JSON.stringify(result.error.flatten())}`)
  return result.data
}

async function main() {
  loadEnvConfig(process.cwd())
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required")

  const { and, eq } = await import("drizzle-orm")
  const { getDb } = await import("@/lib/db")
  const { buildDemoSeedData, DEMO_CID_NUMBERS, DEMO_SITE_CODES } = await import("@/lib/demo-seed")
  const { fabSubmissionSchema } = await import("@/lib/fab-validation")
  const { schemas, siteSchema } = await import("@/lib/validation")
  const { saveFabGraph } = await import("@/lib/fab-server")
  const { cids, fabs, maintenance, profiles, sites, upgrades } = await import("@/lib/db/schema")
  const db = getDb()

  const placeholder: SeedContext = {
    siteIds: { jakarta: "11111111-1111-4111-8111-111111111111", bandung: "22222222-2222-4222-8222-222222222222", surabaya: "33333333-3333-4333-8333-333333333333" },
    cidIds: { jakarta: "44444444-4444-4444-8444-444444444444", bandung: "55555555-5555-4555-8555-555555555555", surabaya: "66666666-6666-4666-8666-666666666666" },
  }

  const initial = buildDemoSeedData(placeholder)
  const validSites = initial.sites.map(site => requireValid("Site", siteSchema.safeParse(site)))
  const siteIds = {} as SeedContext["siteIds"]
  for (const site of validSites) {
    const values = { namaSite: site.nama_site, siteId: site.site_id, provinsi: site.provinsi, kotaKabupaten: site.kota_kabupaten, vlan: site.vlan, kapasitasBandwidth: site.kapasitas_bandwidth, mediaAkses: site.media_akses, picCustomer: site.pic_customer, noTelpPic: site.no_telp_pic, picIsp: site.pic_isp, tanggalAktivasi: site.tanggal_aktivasi, statusLayanan: site.status_layanan, keterangan: site.keterangan }
    const [existing] = await db.select({ id: sites.id }).from(sites).where(eq(sites.siteId, site.site_id)).limit(1)
    const [saved] = existing ? await db.update(sites).set(values).where(eq(sites.id, existing.id)).returning({ id: sites.id }) : await db.insert(sites).values(values).returning({ id: sites.id })
    if (!saved) throw new Error(`Site seed failed for ${site.site_id}`)
    if (site.site_id === DEMO_SITE_CODES.jakarta) siteIds.jakarta = saved.id
    if (site.site_id === DEMO_SITE_CODES.bandung) siteIds.bandung = saved.id
    if (site.site_id === DEMO_SITE_CODES.surabaya) siteIds.surabaya = saved.id
  }

  const withSites = buildDemoSeedData({ siteIds, cidIds: placeholder.cidIds })
  const validCids = withSites.cids.map(cid => requireValid("CID", schemas.cids.safeParse(cid)))
  const cidIds = {} as SeedContext["cidIds"]
  for (const cid of validCids) {
    const values = { siteId: cid.site_id, cidNumber: cid.cid_number, customer: cid.customer, serviceType: cid.service_type, bandwidth: cid.bandwidth, vlan: cid.vlan, ipAddress: cid.ip_address, activationDate: cid.activation_date, status: cid.status, pic: cid.pic, notes: cid.notes }
    const [existing] = await db.select({ id: cids.id }).from(cids).where(eq(cids.cidNumber, cid.cid_number)).limit(1)
    const [saved] = existing ? await db.update(cids).set(values).where(eq(cids.id, existing.id)).returning({ id: cids.id }) : await db.insert(cids).values(values).returning({ id: cids.id })
    if (!saved) throw new Error(`CID seed failed for ${cid.cid_number}`)
    if (cid.cid_number === DEMO_CID_NUMBERS.jakarta) cidIds.jakarta = saved.id
    if (cid.cid_number === DEMO_CID_NUMBERS.bandung) cidIds.bandung = saved.id
    if (cid.cid_number === DEMO_CID_NUMBERS.surabaya) cidIds.surabaya = saved.id
  }

  const data = buildDemoSeedData({ siteIds, cidIds })
  const fab = requireValid("FAB", fabSubmissionSchema.safeParse(data.fab))
  const validUpgrades = data.upgrades.map(upgrade => requireValid("Upgrade", schemas.upgrades.safeParse(upgrade)))
  const validMaintenance = data.maintenance.map(item => requireValid("Maintenance", schemas.maintenance.safeParse(item)))
  const [admin] = await db.select({ id: profiles.id, role: profiles.role }).from(profiles).where(and(eq(profiles.role, "admin"), eq(profiles.isActive, true))).limit(1)
  if (!admin) throw new Error("An active admin profile is required. Run db:seed-admin first.")

  const [existingFab] = await db.select({ id: fabs.id }).from(fabs).where(eq(fabs.fabNumber, fab.fab_number)).limit(1)
  await saveFabGraph(db, admin, fab, existingFab?.id)

  for (const upgrade of validUpgrades) {
    const values = { siteId: upgrade.site_id, cidId: upgrade.cid_id ?? null, currentBandwidth: upgrade.current_bandwidth, requestedBandwidth: upgrade.requested_bandwidth, requestDate: upgrade.request_date ?? null, targetDate: upgrade.target_date ?? null, completionDate: upgrade.completion_date ?? null, status: upgrade.status, pic: upgrade.pic, notes: upgrade.notes ?? null }
    const [existing] = await db.select({ id: upgrades.id }).from(upgrades).where(eq(upgrades.notes, upgrade.notes ?? "")).limit(1)
    if (existing) await db.update(upgrades).set(values).where(eq(upgrades.id, existing.id))
    else await db.insert(upgrades).values(values)
  }

  for (const item of validMaintenance) {
    const values = { siteId: item.site_id, cidId: item.cid_id ?? null, maintenanceType: item.maintenance_type, scheduledAt: item.scheduled_at ?? null, startedAt: item.started_at ?? null, completedAt: item.completed_at ?? null, impact: item.impact, status: item.status, picVendor: item.pic_vendor, notes: item.notes ?? null }
    const [existing] = await db.select({ id: maintenance.id }).from(maintenance).where(eq(maintenance.notes, item.notes ?? "")).limit(1)
    if (existing) await db.update(maintenance).set(values).where(eq(maintenance.id, existing.id))
    else await db.insert(maintenance).values(values)
  }

  console.log("Demo seed complete: 3 sites, 3 CIDs, 1 complete FAB, 2 upgrades, and 2 maintenance records.")
}

main().catch(error => {
  console.error("Demo seed failed:", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
