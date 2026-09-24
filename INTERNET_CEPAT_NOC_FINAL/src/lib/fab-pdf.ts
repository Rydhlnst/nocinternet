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

/** Read a value from an object accepting both snake_case and camelCase keys. */
function pick(source: Record<string, any> | null | undefined, snake: string, camel: string) {
  if (!source) return undefined
  return source[snake] ?? source[camel]
}

/**
 * The FAB aggregate returned by getFabAggregate exposes nested contacts, billing
 * and document rows as raw Drizzle rows (camelCase), while a raw API payload uses
 * snake_case. Normalise both into a single snake_case shape so the PDF mapping
 * never silently misses a value.
 */
function readContact(contact: Record<string, any> | null | undefined) {
  return {
    name: contact?.name,
    department: contact?.department,
    title: contact?.title,
    email: contact?.email,
    phone_code: pick(contact, "phone_code", "phoneCode"),
    phone_number: pick(contact, "phone_number", "phoneNumber"),
    phone_extension: pick(contact, "phone_extension", "phoneExtension"),
    mobile_code: pick(contact, "mobile_code", "mobileCode"),
    mobile_number: pick(contact, "mobile_number", "mobileNumber"),
    birth_place: pick(contact, "birth_place", "birthPlace"),
    birth_date: pick(contact, "birth_date", "birthDate"),
    id_type: pick(contact, "id_type", "idType"),
    id_number: pick(contact, "id_number", "idNumber"),
    id_expiry: pick(contact, "id_expiry", "idExpiry"),
  }
}

function dateParts(value?: string | Date | null): [string, string, string] {
  if (!value) return ["", "", ""]
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  const [year, month, day] = text.split("-")
  return [day ?? "", month ?? "", year ?? ""]
}

/**
 * Build the flat map of template field values from a FAB aggregate. Kept pure and
 * exported so the field mapping can be unit tested without touching the template PDF.
 */
export function buildFabFieldValues(data: FabPdfData) {
  const text: Record<string, string> = {}
  const checks: Record<string, boolean> = {}
  const put = (name: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return
    text[name] = String(value)
  }
  const putDate = (prefix: string, value?: string | Date | null) => {
    const [day, month, year] = dateParts(value)
    put(`TanggalDate${prefix}`, day)
    put(`BulanMonth${prefix}`, month)
    put(`TahunYear${prefix}`, year)
  }

  // Step 1 — contract
  putDate("", data.contract_date)
  put("NoFABFAB Number", data.fab_number)
  put("undefined_2", data.job_type)
  put("undefined_1", data.previous_fab_number)

  // Applicant / Person In Charge
  const applicant = readContact(data.applicant)
  put("Penanggung JawabPerson In Charge", applicant.name)
  put("undefined_3", applicant.birth_place)
  put("undefined_4", applicant.title)
  put("Kode AreaArea Code", applicant.phone_code)
  put("Nomor TeleponPhone Number", applicant.phone_number)
  put("Kode AreaArea Code_2", applicant.mobile_code)
  put("Nomor TeleponPhone Number_2", applicant.mobile_number)
  put("undefined_5", applicant.id_type)
  put("undefined_7", applicant.id_number)
  putDate("_2", applicant.birth_date)
  putDate("_3", applicant.id_expiry)

  // Company information
  put("Informasi PerusahaanCompany Information", data.company?.name)
  put("undefined_8", data.company?.group)
  put("undefined_9", data.company?.business_type)
  put("undefined_10", data.company?.address)
  put("undefined_12", data.company?.city)
  put("ProvinsiProvince", data.company?.province)
  put("Kode PosZip Code", data.company?.postal_code)
  put("undefined_13", data.company?.email)
  put("undefined_14", data.company?.npwp)
  put("Nomor TeleponPhone Number_3", data.company?.phone)

  // Services (up to 5 rows)
  for (const service of data.services ?? []) {
    const suffix = String(service.sequence ?? 1)
    const tech = readContact(service.technical_contact)
    put(`Penanggung Jawab TeknisiTechnical Person In Charge${suffix}`, tech.name)
    put(`BagianDepartment${suffix}`, tech.department)
    put(`EmailEmail${suffix}`, tech.email)
    put(`Kode AreaArea Code_4${suffix}`, tech.phone_code)
    put(`Nomor TeleponPhone Number_4${suffix}`, tech.phone_number)
    put(`Kode AreaArea Code_5${suffix}`, tech.mobile_code)
    put(`Nomor TeleponPhone Number_5${suffix}`, tech.mobile_number)
    const endpoints = service.endpoints ?? []
    const origin = endpoints.find((endpoint: Record<string, any>) => endpoint.role === "origin")
    const destination = endpoints.find((endpoint: Record<string, any>) => endpoint.role === "destination")
    put(`AsalOrigin${suffix}`, origin?.country)
    put(`TujuanDestination${suffix}`, destination?.country)
    putDate(`_4${suffix}`, service.requested_rfs_date)
  }

  // Financial contact + billing
  const financial = readContact(data.financial_contact)
  put("Penanggung Jawab KeuanganFinancial Person In Charge", financial.name)
  put("BagianDepartment_6", financial.department)
  put("EmailEmail_6", financial.email)
  put("Kode AreaArea Code_14", financial.phone_code)
  put("Nomor TeleponPhone Number_14", financial.phone_number)
  put("Kode AreaArea Code_15", financial.mobile_code)
  put("Nomor TeleponPhone Number_15", financial.mobile_number)
  put("Alamat TagihanBilling Address", pick(data.billing, "billing_address", "billingAddress"))
  put("Mata Uang 1", data.billing?.currency)
  put("CatatanNotes", data.notes)

  // Document verifications
  const documents = data.document_verifications ?? []
  const isVerified = (type: string) =>
    Boolean(documents.find((item: Record<string, any>) => pick(item, "document_type", "documentType") === type)?.verified)
  checks["Fotokopi KTP"] = isVerified("id_card")
  checks["Fotokopi NPWP"] = isVerified("npwp")

  return { text, checks }
}

function setText(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  try { form.getTextField(name).setText(value) } catch { /* template fields differ by page */ }
}

function setCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, checked: boolean) {
  try { checked ? form.getCheckBox(name).check() : form.getCheckBox(name).uncheck() } catch { /* optional template field */ }
}

export async function renderFabPdf(data: FabPdfData) {
  const templatePath = path.join(process.cwd(), "src", "lib", "fab", "subscription-form-template.pdf")
  const document = await PDFDocument.load(await readFile(templatePath), { ignoreEncryption: true })
  const form = document.getForm()
  clearFabTemplateFields(form)
  const { text, checks } = buildFabFieldValues(data)
  for (const [name, value] of Object.entries(text)) setText(form, name, value)
  for (const [name, checked] of Object.entries(checks)) setCheck(form, name, checked)
  for (const field of form.getFields()) if (field instanceof PDFTextField) field.enableMultiline()
  form.updateFieldAppearances()
  form.flatten()
  for (const page of document.getPages()) page.translateContent(FINAL_ARTWORK_OFFSET_X, 0)
  return document.save()
}
