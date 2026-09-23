import { describe, expect, it } from "vitest"
import {
  fabStep1Schema, fabStep2Schema, fabStep3Schema,
  fabStep4Schema, fabStep5Schema, fabStep6Schema,
  FAB_STEP_SCHEMAS,
} from "@/lib/validation"

const SITE_UUID = "00000000-0000-4000-8000-000000000001"

describe("FAB wizard — step-by-step validation", () => {
  // Step 1
  it("OK FAB-01 Step 1 accepts valid contract info", () => {
    const result = fabStep1Schema.safeParse({ fab_number: "FAB-0001", job_type: "Pasang Baru" })
    expect(result.success).toBe(true)
  })
  it("OK FAB-01b Step 1 accepts optional fields omitted (undefined)", () => {
    const result = fabStep1Schema.safeParse({ fab_number: "FAB-0001", job_type: "Upgrade" })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-01c Step 1 rejects empty string for date (must be undefined/null/valid)", () => {
    const result = fabStep1Schema.safeParse({ fab_number: "FAB-0001", job_type: "Upgrade", contract_date: "" })
    expect(result.success).toBe(false)
  })
  it("ERR FAB-01 Step 1 rejects missing fab_number", () => {
    const result = fabStep1Schema.safeParse({ fab_number: "", job_type: "Pasang Baru" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe("fab_number")
  })
  it("ERR FAB-01b Step 1 rejects missing job_type", () => {
    const result = fabStep1Schema.safeParse({ fab_number: "FAB-0002", job_type: "" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe("job_type")
  })

  // Step 2
  it("OK FAB-02 Step 2 accepts valid company info", () => {
    const result = fabStep2Schema.safeParse({ company_name: "PT Contoh Tbk" })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-02 Step 2 rejects invalid company email", () => {
    const result = fabStep2Schema.safeParse({ company_name: "PT Contoh", company_email: "not-an-email" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe("company_email")
  })
  it("ERR FAB-02b Step 2 rejects missing company_name", () => {
    const result = fabStep2Schema.safeParse({ company_name: "" })
    expect(result.success).toBe(false)
  })

  // Step 3
  it("OK FAB-03 Step 3 accepts valid PIC info", () => {
    const result = fabStep3Schema.safeParse({ pic_name: "Budi Santoso", pic_position: "IT Manager" })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-03 Step 3 rejects missing pic_name", () => {
    const result = fabStep3Schema.safeParse({ pic_name: "", pic_position: "Manager" })
    expect(result.success).toBe(false)
  })
  it("ERR FAB-03b Step 3 rejects missing pic_position", () => {
    const result = fabStep3Schema.safeParse({ pic_name: "Budi", pic_position: "" })
    expect(result.success).toBe(false)
  })

  // Step 4
  it("OK FAB-04 Step 4 accepts valid service info", () => {
    const result = fabStep4Schema.safeParse({ service_type: "Internet Dedicated", bandwidth_up: "100 Mbps", bandwidth_down: "100 Mbps" })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-04 Step 4 rejects missing service_type", () => {
    const result = fabStep4Schema.safeParse({ service_type: "" })
    expect(result.success).toBe(false)
  })

  // Step 5
  it("OK FAB-05 Step 5 accepts valid site uuid", () => {
    const result = fabStep5Schema.safeParse({ site_id: SITE_UUID })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-05 Step 5 rejects non-UUID site_id", () => {
    const result = fabStep5Schema.safeParse({ site_id: "not-a-uuid" })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path[0]).toBe("site_id")
  })

  // Step 6
  it("OK FAB-06 Step 6 accepts valid RFS info", () => {
    const result = fabStep6Schema.safeParse({ status: "Open", rfs_date: "2025-12-01" })
    expect(result.success).toBe(true)
  })
  it("ERR FAB-06 Step 6 rejects missing status", () => {
    const result = fabStep6Schema.safeParse({ status: "" })
    expect(result.success).toBe(false)
  })
  it("ERR FAB-06b Step 6 rejects invalid date format", () => {
    const result = fabStep6Schema.safeParse({ status: "Open", rfs_date: "01-12-2025" })
    expect(result.success).toBe(false)
  })

  // FAB_STEP_SCHEMAS array
  it("OK FAB-07 FAB_STEP_SCHEMAS exports 6 schemas", () => {
    expect(FAB_STEP_SCHEMAS).toHaveLength(6)
  })
  it("OK FAB-07b each schema in FAB_STEP_SCHEMAS is a Zod object with safeParse", () => {
    for (const schema of FAB_STEP_SCHEMAS) {
      expect(typeof schema.safeParse).toBe("function")
    }
  })
})
