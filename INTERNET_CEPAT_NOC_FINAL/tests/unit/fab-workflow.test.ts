import { describe, expect, it } from "vitest"
import { fabDraftSchema, fabSubmissionSchema } from "@/lib/fab-validation"

const completeFab = {
  fab_number: "FAB-2026-001",
  workflow_status: "draft",
  operational_status: "Open",
  contract_date: "2026-09-23",
  job_type: "New Installation",
  company: { name: "PT Internet Cepat Indonesia", address: "Jakarta" },
  applicant: { name: "Chaeril", title: "Director", email: "chaeril@example.com", id_type: "KTP", id_number: "7302022709950001" },
  financial_contact: { name: "Finance", title: "Manager", email: "finance@example.com" },
  services: [{
    sequence: 1,
    requested_rfs_date: "2026-10-01",
    technical_contact: { name: "Technician", title: "Engineer", email: "tech@example.com" },
    products: [{ category: "internet", product: "Dedicated", unit: "Mbps", quantity: 500 }],
    endpoints: [
      { role: "origin", country: "Indonesia", company_name: "PT Internet Cepat", address: "Jakarta", latitude: -6.2, longitude: 106.8 },
      { role: "destination", country: "Indonesia", company_name: "Customer", address: "Bandung", latitude: -6.9, longitude: 107.6 },
    ],
  }],
  billing: { term_months: 12, billing_address: "Jakarta", currency: "IDR", vat_rate: 11, charges: [{ type: "monthly", service_amount: 1000000, port_amount: 0, local_access_amount: 0, on_demand_amount: 0, schedule_amount: 0, cpe_amount: 0, other_amount: 0 }] },
  document_verifications: [{ document_type: "id_card", verified: true }, { document_type: "npwp", verified: true }],
  declaration_confirmed: true,
}

describe("detailed FAB workflow validation", () => {
  it("accepts incomplete drafts but rejects incomplete submissions", () => {
    expect(fabDraftSchema.safeParse({ fab_number: "FAB-DRAFT", workflow_status: "draft", operational_status: "Open" }).success).toBe(true)
    expect(fabSubmissionSchema.safeParse({ fab_number: "FAB-DRAFT", workflow_status: "submitted", operational_status: "Open" }).success).toBe(false)
  })

  it("accepts a complete submission with calculated charge inputs", () => {
    expect(fabSubmissionSchema.safeParse({ ...completeFab, workflow_status: "submitted" }).success).toBe(true)
  })

  it("rejects more than five service requests", () => {
    expect(fabSubmissionSchema.safeParse({ ...completeFab, workflow_status: "submitted", services: Array.from({ length: 6 }, (_, index) => ({ ...completeFab.services[0], sequence: index + 1 })) }).success).toBe(false)
  })
})
