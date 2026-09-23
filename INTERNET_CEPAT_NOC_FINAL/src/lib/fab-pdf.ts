import { readFile } from "node:fs/promises"
import path from "node:path"
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFTextField } from "pdf-lib"

type FabPdfData = Record<string, any>

const FINAL_ARTWORK_OFFSET_X = 22

export function clearFabTemplateFields(form: ReturnType<PDFDocument["getForm"]>) {
  for (const field of form.getFields()) {
    if (field instanceof PDFTextField) field.setText("")
    if (field instanceof PDFCheckBox) field.uncheck()
    if (field instanceof PDFDropdown) field.clear()
  }
}

function dateParts(value?: string | null) {
  if (!value) return ["", "", ""]
  const [year, month, day] = value.split("-")
  return [day ?? "", month ?? "", year ?? ""]
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: unknown) {
  if (value === null || value === undefined || value === "") return
  try { form.getTextField(name).setText(String(value)) } catch { /* template fields differ by page */ }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, checked: boolean) {
  try { checked ? form.getCheckBox(name).check() : form.getCheckBox(name).uncheck() } catch { /* optional template field */ }
}

export async function renderFabPdf(data: FabPdfData) {
  const templatePath = path.join(process.cwd(), "src", "lib", "fab", "subscription-form-template.pdf")
  const document = await PDFDocument.load(await readFile(templatePath), { ignoreEncryption: true })
  const form = document.getForm()
  clearFabTemplateFields(form)
  const [contractDay, contractMonth, contractYear] = dateParts(data.contract_date)
  setText(form, "TanggalDate", contractDay); setText(form, "BulanMonth", contractMonth); setText(form, "TahunYear", contractYear)
  setText(form, "NoFABFAB Number", data.fab_number); setText(form, "undefined_2", data.job_type); setText(form, "undefined_1", data.previous_fab_number)
  setText(form, "Penanggung JawabPerson In Charge", data.applicant?.name); setText(form, "undefined_3", data.applicant?.birth_place); setText(form, "undefined_4", data.applicant?.title)
  setText(form, "Kode AreaArea Code", data.applicant?.phone_code); setText(form, "Nomor TeleponPhone Number", data.applicant?.phone_number)
  setText(form, "Kode AreaArea Code_2", data.applicant?.mobile_code); setText(form, "Nomor TeleponPhone Number_2", data.applicant?.mobile_number)
  setText(form, "undefined_5", data.applicant?.id_type); setText(form, "undefined_7", data.applicant?.id_number)
  const [birthDay, birthMonth, birthYear] = dateParts(data.applicant?.birth_date); setText(form, "TanggalDate_2", birthDay); setText(form, "BulanMonth_2", birthMonth); setText(form, "TahunYear_2", birthYear)
  const [expiryDay, expiryMonth, expiryYear] = dateParts(data.applicant?.id_expiry); setText(form, "TanggalDate_3", expiryDay); setText(form, "BulanMonth_3", expiryMonth); setText(form, "TahunYear_3", expiryYear)
  setText(form, "Informasi PerusahaanCompany Information", data.company?.name); setText(form, "undefined_8", data.company?.group); setText(form, "undefined_9", data.company?.business_type); setText(form, "undefined_10", data.company?.address); setText(form, "undefined_12", data.company?.city); setText(form, "ProvinsiProvince", data.company?.province); setText(form, "Kode PosZip Code", data.company?.postal_code); setText(form, "undefined_13", data.company?.email); setText(form, "undefined_14", data.company?.npwp); setText(form, "Kode AreaArea Code_3", data.company?.phone)
  for (const service of data.services ?? []) {
    const suffix = service.sequence === 1 ? "1" : String(service.sequence)
    setText(form, `Penanggung Jawab TeknisiTechnical Person In Charge${suffix}`, service.technical_contact?.name)
    setText(form, `BagianDepartment${suffix}`, service.technical_contact?.department); setText(form, `EmailEmail${suffix}`, service.technical_contact?.email)
    setText(form, `Kode AreaArea Code_4${suffix}`, service.technical_contact?.phone_code); setText(form, `Nomor TeleponPhone Number_4${suffix}`, service.technical_contact?.phone_number)
    setText(form, `Kode AreaArea Code_5${suffix}`, service.technical_contact?.mobile_code); setText(form, `Nomor TeleponPhone Number_5${suffix}`, service.technical_contact?.mobile_number)
    const origin = service.endpoints?.find((endpoint: Record<string, any>) => endpoint.role === "origin")
    const destination = service.endpoints?.find((endpoint: Record<string, any>) => endpoint.role === "destination")
    setText(form, `AsalOrigin${suffix}`, origin?.country); setText(form, `TujuanDestination${suffix}`, destination?.country)
    const [rfsDay, rfsMonth, rfsYear] = dateParts(service.requested_rfs_date); setText(form, `TanggalDate_4${suffix}`, rfsDay); setText(form, `BulanMonth_4${suffix}`, rfsMonth); setText(form, `TahunYear_4${suffix}`, rfsYear)
  }
  setText(form, "Penanggung Jawab KeuanganFinancial Person In Charge", data.financial_contact?.name); setText(form, "BagianDepartment_6", data.financial_contact?.department); setText(form, "EmailEmail_6", data.financial_contact?.email); setText(form, "Alamat TagihanBilling Address", data.billing?.billing_address); setText(form, "Mata Uang 1", data.billing?.currency)
  setCheck(form, "Fotokopi KTP", Boolean(data.document_verifications?.find((item: Record<string, any>) => item.document_type === "id_card")?.verified)); setCheck(form, "Fotokopi NPWP", Boolean(data.document_verifications?.find((item: Record<string, any>) => item.document_type === "npwp")?.verified))
  for (const field of form.getFields()) if (field instanceof PDFTextField) field.enableMultiline()
  form.updateFieldAppearances()
  form.flatten()
  for (const page of document.getPages()) page.translateContent(FINAL_ARTWORK_OFFSET_X, 0)
  return document.save()
}
