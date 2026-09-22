import { describe, expect, it } from "vitest"
import { resourceFields, resourceLabels, type Resource } from "@/lib/types"
import { schemas, siteSchema } from "@/lib/validation"
const resources: Resource[] = ["sites", "cids", "fabs", "upgrades", "maintenance"]
const siteId = "00000000-0000-4000-8000-000000000001"
describe("NOC CRUD contracts", () => {
  it.each(resources)("OK CRUD-01 %s exposes fields for create/edit/import", resource => { expect(resourceLabels[resource]).toBeTruthy(); expect(resourceFields[resource].length).toBeGreaterThan(0); expect(resourceFields[resource].some(field => field.required)).toBe(true) })
  it.each(["cids", "fabs", "upgrades", "maintenance"] as const)("OK CRUD-02 %s accepts a valid linked record", resource => { const input: Record<string, unknown> = resource === "upgrades" ? { site_id: siteId, status: "Requested", current_bandwidth: "100 Mbps", requested_bandwidth: "200 Mbps" } : resource === "cids" ? { site_id: siteId, status: "Active", cid_number: "CID-001" } : resource === "fabs" ? { site_id: siteId, status: "Open", fab_number: "FAB-001" } : { site_id: siteId, status: "Scheduled", maintenance_type: "Preventive" }; expect(schemas[resource].safeParse(input).success).toBe(true) })
  it("OK CRUD-03 sites accepts the database structure fields", () => { expect(siteSchema.safeParse({ nama_site: "Site A", site_id: "SITE-001", provinsi: "Jawa Barat", kota_kabupaten: "Bandung", status_layanan: "Aktif" }).success).toBe(true) })
  it.each(["cids", "fabs", "upgrades", "maintenance"] as const)("ERR CRUD-04 rejects %s without a valid site UUID", resource => { expect(schemas[resource].safeParse({ site_id: "not-a-uuid", status: "Open" }).success).toBe(false) })
  it("ERR CRUD-05 rejects a site without required identity fields", () => { expect(siteSchema.safeParse({ status_layanan: "Aktif" }).success).toBe(false) })
})
