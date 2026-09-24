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
  financial_contact: { name: "Siti Aminah", title: "Manager", department: "Finance", email: "finance@contoh.co.id", phoneCode: "021", phoneNumber: "5550003", mobileCode: "+62", mobileNumber: "81200000002" },
  services: [
    { sequence: 1, requested_rfs_date: "2026-02-01", technical_contact: { name: "Andi", title: "NOC Lead", department: "NOC", email: "noc@contoh.co.id", phoneCode: "021", phoneNumber: "5550004", mobileCode: "+62", mobileNumber: "81200000003" }, endpoints: [{ role: "origin", country: "Indonesia", companyName: "PT Contoh", address: "Jl. Asal 1", latitude: -6.2, longitude: 106.8 }, { role: "destination", country: "Singapore", companyName: "Contoh SG", address: "Marina 2", latitude: 1.29, longitude: 103.85 }] },
  ],
  billing: { billingAddress: "Jl. Tagihan 5", currency: "IDR", termMonths: 26, charges: [
    { type: "installation", description: "Setup", portAmount: "1000000", localAccessAmount: "500000", otherAmount: "0", subtotal: "1500000", vatAmount: "165000", total: "1665000" },
    { type: "monthly", description: "Langganan", portAmount: "2000000", localAccessAmount: "0", onDemandAmount: "0", scheduleAmount: "0", cpeAmount: "300000", otherAmount: "0", serviceAmount: "0", subtotal: "2300000", vatAmount: "253000", total: "2553000" },
  ] },
  document_verifications: [{ documentType: "id_card", verified: true }, { documentType: "npwp", verified: false }],
}

describe("buildFabFieldValues", () => {
  it("maps camelCase aggregate rows into template fields", () => {
    const { text, checks, dropdowns } = buildFabFieldValues(aggregate)

    // Contract — job type is a dropdown, previous FAB is the undefined_2 comb box
    expect(text["NoFABFAB Number"]).toBe("FAB-DEMO-2026-001")
    expect([text["TanggalDate"], text["BulanMonth"], text["TahunYear"]]).toEqual(["15", "01", "2026"])
    expect(dropdowns["Dropdown1"]).toBe("New Install")
    expect(text["undefined_2"]).toBe("FAB-2025-900")

    // Applicant — previously blank because keys were read as snake_case
    expect(text["undefined_3"]).toBe("Bandung")
    expect(text["undefined_4"]).toBe("Direktur")
    expect(text["Kode AreaArea Code"]).toBe("021")
    expect(text["Nomor TeleponPhone Number"]).toBe("5550002")
    expect(text["Nomor TeleponPhone Number_2"]).toBe("81200000001")
    expect(text["undefined_5"]).toBe("KTP")
    expect(text["undefined_7"]).toBe("3273010101850001")
    expect([text["TanggalDate_2"], text["BulanMonth_2"], text["TahunYear_2"]]).toEqual(["20", "04", "1985"])
    expect([text["TanggalDate_3"], text["BulanMonth_3"], text["TahunYear_3"]]).toEqual(["20", "04", "2030"])

    // Company — website box is the misnamed KotaCity field
    expect(text["Informasi PerusahaanCompany Information"]).toBe("PT Contoh")
    expect(text["Nomor TeleponPhone Number_3"]).toBe("0215550001")

    // Service — Job Title lives in EmailEmail1, Email lives in undefined_151
    expect(text["Penanggung Jawab TeknisiTechnical Person In Charge1"]).toBe("Andi")
    expect(text["EmailEmail1"]).toBe("NOC Lead")
    expect(text["undefined_151"]).toBe("noc@contoh.co.id")
    expect(text["Nomor TeleponPhone Number_41"]).toBe("5550004")
    expect(text["AsalOrigin1"]).toBe("Indonesia")
    expect(text["TujuanDestination1"]).toBe("Singapore")
    expect(text["undefined_531"]).toBe("PT Contoh")
    expect(text["undefined_551"]).toBe("Jl. Asal 1")
    expect([text["TanggalDate_41"], text["BulanMonth_41"], text["TahunYear_41"]]).toEqual(["01", "02", "2026"])

    // Financial — Job Title in EmailEmail_6, Email in undefined_280
    expect(text["Penanggung Jawab KeuanganFinancial Person In Charge"]).toBe("Siti Aminah")
    expect(text["EmailEmail_6"]).toBe("Manager")
    expect(text["undefined_280"]).toBe("finance@contoh.co.id")
    expect(text["Nomor TeleponPhone Number_14"]).toBe("5550003")

    // Terms of subscription — 26 months -> 2 years / 2 months
    expect(text["TahunYear_9"]).toBe("2")
    expect(text["BulanMonth_9"]).toBe("2")

    // Charges
    expect(text["Instalasi Port"]).toBe("1.000.000")
    expect(text["undefined_281"]).toBe("1.665.000")
    expect(text["Port"]).toBe("2.000.000")
    expect(text["undefined_308"]).toBe("2.553.000")

    // Billing / currency dropdown / documents
    expect(text["Alamat TagihanBilling Address"]).toBe("Jl. Tagihan 5")
    expect(dropdowns["Mata Uang 1"]).toBe("IDR")
    expect(checks["Fotokopi KTP"]).toBe(true)
    expect(checks["Fotokopi NPWP"]).toBe(false)
  })

  it("adds financial job title", () => {
    const { text } = buildFabFieldValues(aggregate)
    expect(text["EmailEmail_6"]).toBe("Manager")
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
