import { expect, it } from "vitest"
import { redactFabForStaff } from "@/lib/fab-server"

it("masks identity and financial values in staff detail payloads", () => {
  const result = redactFabForStaff({
    applicant: { idNumber: "7302022709950001" },
    financial_contact: { name: "Finance" },
    billing: { charges: [{ total: "1500000" }] },
  })
  expect(result.applicant.idNumber).toBe("************0001")
  expect(result.financial_contact.name).toBe("Finance")
  expect(result.billing.charges[0].total).toBeUndefined()
})
