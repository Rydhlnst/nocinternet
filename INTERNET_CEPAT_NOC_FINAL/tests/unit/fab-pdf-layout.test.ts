import { describe, expect, it } from "vitest"
import { PDFDocument } from "pdf-lib"
import { renderFabPdf } from "@/lib/fab-pdf"

describe("renderFabPdf", () => {
  it("creates a flattened A4 document", async () => {
    const bytes = await renderFabPdf({})
    const document = await PDFDocument.load(bytes)
    const [firstPage] = document.getPages()

    expect(firstPage.getWidth()).toBeCloseTo(595.276, 3)
    expect(firstPage.getHeight()).toBeCloseTo(841.89, 2)
    expect(document.getForm().getFields()).toHaveLength(0)
  })
})
