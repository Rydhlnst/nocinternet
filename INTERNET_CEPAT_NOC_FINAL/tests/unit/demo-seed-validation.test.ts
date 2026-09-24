import { describe, expect, it } from "vitest"
import { buildDemoSeedData } from "@/lib/demo-seed"
import { fabSubmissionSchema } from "@/lib/fab-validation"
import { schemas, siteSchema } from "@/lib/validation"

describe("demo seed data", () => {
  it("provides validated linked records for every operational module", () => {
    const demo = buildDemoSeedData({
      siteIds: { jakarta: "11111111-1111-4111-8111-111111111111", bandung: "22222222-2222-4222-8222-222222222222", surabaya: "33333333-3333-4333-8333-333333333333" },
      cidIds: { jakarta: "44444444-4444-4444-8444-444444444444", bandung: "55555555-5555-4555-8555-555555555555", surabaya: "66666666-6666-4666-8666-666666666666" },
    })

    expect(siteSchema.safeParse(demo.sites[0]).success).toBe(true)
    expect(schemas.cids.safeParse(demo.cids[0]).success).toBe(true)
    expect(fabSubmissionSchema.safeParse(demo.fab).success).toBe(true)
    expect(schemas.upgrades.safeParse(demo.upgrades[0]).success).toBe(true)
    expect(schemas.maintenance.safeParse(demo.maintenance[0]).success).toBe(true)
    expect(demo.fab.services).toHaveLength(1)
    expect(demo.fab.billing.charges).toHaveLength(2)
    expect(demo.fab.document_verifications.every(document => document.verified)).toBe(true)
  })
})