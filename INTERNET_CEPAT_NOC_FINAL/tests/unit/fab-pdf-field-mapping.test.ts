import { describe, expect, it } from "vitest"
import { buildFabFieldValues } from "@/lib/fab-pdf"

// Mirrors the shape produced by getFabAggregate: top-level snake_case, but the
// nested contact/billing/document rows are raw Drizzle rows (camelCase).
const aggregate = {
  fab_number: "FAB-DEMO-2026-001",
  contract_date: "2026-01-15",
  job_type: "New Install",
  previous_fab_number: "FAB-2025-900",
  notes: "Priority customer",
  company: { name: "PT Contoh", group: "Grup Contoh", business_type: "Perbankan", address: "Jl. Sudirman 1", city: "Jakarta", province: "D.K.I. Jakarta", postal_code: "10110", email: "ops@contoh.co.id", npwp: "01.234.567.8-901.000", phone: "0215550001" },
  applicant: { name: "Budi Santoso", title: "Direktur", birthPlace: "Bandung", birthDate: "1985-04-20", phoneCode: "021", phoneNumber: "5550002", mobileCode: "+62", mobileNumber: "81200000001", idType: "KTP", idNumber: "3273010101850001", idExpiry: "2030-04-20" },
  financial_contact: { name: "Siti Aminah", department: "Finance", email: "finance@contoh.co.id", phoneCode: "021", phoneNumber: "5550003", mobileCode: "+62", mobileNumber: "81200000002" },
  services: [
    { sequence: 1, requested_rfs_date: "2026-02-01", technical_contact: { name: "Andi", department: "NOC", email: "noc@contoh.co.id", phoneCode: "021", phoneNumber: "5550004", mobileCode: "+62", mobileNumber: "81200000003" }, endpoints: [{ role: "origin", country: "Indonesia" }, { role: "destination", country: "Singapore" }] },
  ],
  billing: { billingAddress: "Jl. Tagihan 5", currency: "IDR" },
  document_verifications: [{ documentType: "id_card", verified: true }, { documentType: "npwp", verified: false }],
}

describe("buildFabFieldValues", () => {
  it("maps camelCase aggregate rows into template fields", () => {
    const { text, checks } = buildFabFieldValues(aggregate)

    // Contract
    expect(text["NoFABFAB Number"]).toBe("FAB-DEMO-2026-001")
    expect([text["TanggalDate"], text["BulanMonth"], text["TahunYear"]]).toEqual(["15", "01", "2026"])
    expect(text["undefined_2"]).toBe("New Install")

    // Applicant — previously blank because keys were read as snake_case
    expect(text["undefined_3"]).toBe("Bandung")
    expect(text["Kode AreaArea Code"]).toBe("021")
    expect(text["Nomor TeleponPhone Number"]).toBe("5550002")
    expect(text["Nomor TeleponPhone Number_2"]).toBe("81200000001")
    expect(text["undefined_5"]).toBe("KTP")
    expect(text["undefined_7"]).toBe("3273010101850001")
    expect([text["TanggalDate_2"], text["BulanMonth_2"], text["TahunYear_2"]]).toEqual(["20", "04", "1985"])
    expect([text["TanggalDate_3"], text["BulanMonth_3"], text["TahunYear_3"]]).toEqual(["20", "04", "2030"])

    // Company
    expect(text["Informasi PerusahaanCompany Information"]).toBe("PT Contoh")
    expect(text["Nomor TeleponPhone Number_3"]).toBe("0215550001")

    // Service + technical contact + endpoints
    expect(text["Penanggung Jawab TeknisiTechnical Person In Charge1"]).toBe("Andi")
    expect(text["Nomor TeleponPhone Number_41"]).toBe("5550004")
    expect(text["AsalOrigin1"]).toBe("Indonesia")
    expect(text["TujuanDestination1"]).toBe("Singapore")
    expect([text["TanggalDate_41"], text["BulanMonth_41"], text["TahunYear_41"]]).toEqual(["01", "02", "2026"])

    // Financial + billing
    expect(text["Penanggung Jawab KeuanganFinancial Person In Charge"]).toBe("Siti Aminah")
    expect(text["Nomor TeleponPhone Number_14"]).toBe("5550003")
    expect(text["Alamat TagihanBilling Address"]).toBe("Jl. Tagihan 5")
    expect(text["Mata Uang 1"]).toBe("IDR")

    // Documents — checkbox mapping
    expect(checks["Fotokopi KTP"]).toBe(true)
    expect(checks["Fotokopi NPWP"]).toBe(false)
  })

  it("also accepts a raw snake_case payload", () => {
    const { text } = buildFabFieldValues({ applicant: { name: "X", phone_number: "999", id_number: "abc" } })
    expect(text["Nomor TeleponPhone Number"]).toBe("999")
    expect(text["undefined_7"]).toBe("abc")
  })

  it("omits empty values instead of writing blanks", () => {
    const { text, checks } = buildFabFieldValues({})
    expect(text["NoFABFAB Number"]).toBeUndefined()
    expect(checks["Fotokopi KTP"]).toBe(false)
  })
})
