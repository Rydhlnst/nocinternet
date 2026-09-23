import { expect, it } from "vitest"
import { fabDraftSchema } from "@/lib/fab-validation"

it("permits a partially completed service section in a draft", () => {
  const result = fabDraftSchema.safeParse({
    fab_number: "FAB-DRAFT-SERVICE",
    workflow_status: "draft",
    operational_status: "Open",
    services: [{ sequence: 1, requested_rfs_date: "" }],
  })
  expect(result.success).toBe(true)
})
