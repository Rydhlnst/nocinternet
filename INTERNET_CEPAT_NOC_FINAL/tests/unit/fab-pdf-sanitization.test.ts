import { describe, expect, it } from "vitest"
import { PDFDocument } from "pdf-lib"
import { clearFabTemplateFields } from "@/lib/fab-pdf"

describe("clearFabTemplateFields", () => {
  it("clears retained text, checkbox, and dropdown values from a template", async () => {
    const document = await PDFDocument.create()
    const form = document.getForm()
    const text = form.createTextField("name")
    const checkbox = form.createCheckBox("verified")
    const dropdown = form.createDropdown("title")
    text.setText("Template-only value")
    checkbox.check()
    dropdown.addOptions(["Template-only option"])
    dropdown.select("Template-only option")

    clearFabTemplateFields(form)

    expect(text.getText()).toBeUndefined()
    expect(checkbox.isChecked()).toBe(false)
    expect(dropdown.getSelected()).toEqual([])
  })
})