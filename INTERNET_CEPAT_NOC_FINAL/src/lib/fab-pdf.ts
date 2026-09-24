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
    mobile_code: pick(contact, "mobile_code", "mobileCode"),
    mobile_number: pick(contact, "mobile_number", "mobileNumber"),
    birth_place: pick(contact, "birth_place", "birthPlace"),
    birth_date: pick(contact, "birth_date", "birthDate"),
    id_type: pick(contact, "id_type", "idType"),
    id_number: pick(contact, "id_number", "idNumber"),
    id_expiry: pick(contact, "id_expiry", "idExpiry"),
  }
}

function readEndpoint(endpoint: Record<string, any> | null | undefined) {
  return {
    country: endpoint?.country,
    company_name: pick(endpoint, "company_name", "companyName"),
    address: endpoint?.address,
    latitude: endpoint?.latitude,
    longitude: endpoint?.longitude,
  }
}

function dateParts(value?: string | Date | null): [string, string, string] {
  if (!value) return ["", "", ""]
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value)
  const [year, month, day] = text.split("-")
  return [day ?? "", month ?? "", year ?? ""]
}

const AMOUNT_FORMAT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })
function formatAmount(value: unknown): string {
  const num = Number(value ?? 0)
  if (!Number.isFinite(num) || num === 0) return ""
  return AMOUNT_FORMAT.format(Math.round(num))
}
function amount(charge: Record<string, any>, snake: string, camel: string): number {
  return Number(pick(charge, snake, camel) ?? 0) || 0
}

/**
 * Build the flat map of template field values from a FAB aggregate. Kept pure and
 * exported so the field mapping can be unit tested without touching the template PDF.
 * Field names were verified against the Indosat subscription-form template render.
 */
export function buildFabFieldValues(data: FabPdfData) {
  const text: Record<string, string> = {}
  const checks: Record<string, boolean> = {}
  const dropdowns: Record<string, string> = {}
  const put = (name: string, value: unknown) => {
    if (value === null || value === undefined || value === "") return
    text[name] = String(value)
  }
  const putDate = (suffix: string, value?: string | Date | null) => {
    const [day, month, year] = dateParts(value)
    put(`TanggalDate${suffix}`, day)
    put(`BulanMonth${suffix}`, month)
    put(`TahunYear${suffix}`, year)
  }

  // ── Step 1: contract / type of order ────────────────────────────────────────
  putDate("", data.contract_date)
  put("NoFABFAB Number", data.fab_number)
  put("undefined_2", data.previous_fab_number) // "No. FAB sebelumnya" comb box
  if (data.job_type) dropdowns["Dropdown1"] = String(data.job_type) // "Type of Order" dropdown

  // ── Applicant / Person In Charge ────────────────────────────────────────────
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

  // ── Company information ─────────────────────────────────────────────────────
  put("Informasi PerusahaanCompany Information", data.company?.name)
  put("undefined_8", data.company?.group)
  put("undefined_9", data.company?.business_type)
  put("undefined_10", data.company?.address)
  put("undefined_12", data.company?.city)
  put("ProvinsiProvince", data.company?.province)
  put("Kode PosZip Code", data.company?.postal_code)
  put("KotaCity", data.company?.website) // template's "Web/Web Site" box is named KotaCity
  put("undefined_13", data.company?.email)
  put("undefined_14", data.company?.npwp)
  put("Nomor TeleponPhone Number_3", data.company?.phone)

  // ── Services (up to 5 blocks) ───────────────────────────────────────────────
  for (const service of data.services ?? []) {
    const s = String(service.sequence ?? 1)
    const tech = readContact(service.technical_contact)
    put(`Penanggung Jawab TeknisiTechnical Person In Charge${s}`, tech.name)
    put(`EmailEmail${s}`, tech.title) // this box is the technical PIC "Job Title", despite its name
    put(`BagianDepartment${s}`, tech.department)
    put(`undefined_15${s}`, tech.email) // the actual technical "Email" box
    put(`Kode AreaArea Code_4${s}`, tech.phone_code)
    put(`Nomor TeleponPhone Number_4${s}`, tech.phone_number)
    put(`Kode AreaArea Code_5${s}`, tech.mobile_code)
    put(`Nomor TeleponPhone Number_5${s}`, tech.mobile_number)

    const endpoints = service.endpoints ?? []
    const origin = readEndpoint(endpoints.find((endpoint: Record<string, any>) => endpoint.role === "origin"))
    const destination = readEndpoint(endpoints.find((endpoint: Record<string, any>) => endpoint.role === "destination"))
    put(`AsalOrigin${s}`, origin.country)
    put(`TujuanDestination${s}`, destination.country)
    if (s === "1") {
      // Location detail field names are only regular for the first service block.
      put("undefined_531", origin.company_name); put("undefined_541", destination.company_name)
      put("undefined_551", origin.address); put("undefined_561", destination.address)
      put("undefined_571", origin.longitude); put("undefined_581", origin.latitude)
      put("undefined_601", destination.longitude); put("undefined_611", destination.latitude)
    }
    putDate(`_4${s}`, service.requested_rfs_date)
  }

  // ── Financial Person In Charge ──────────────────────────────────────────────
  const financial = readContact(data.financial_contact)
  put("Penanggung Jawab KeuanganFinancial Person In Charge", financial.name)
  put("BagianDepartment_6", financial.department)
  put("EmailEmail_6", financial.title) // this box is the financial PIC "Job Title"
  put("undefined_280", financial.email) // the actual financial "Email" box
  put("Kode AreaArea Code_14", financial.phone_code)
  put("Nomor TeleponPhone Number_14", financial.phone_number)
  put("Kode AreaArea Code_15", financial.mobile_code)
  put("Nomor TeleponPhone Number_15", financial.mobile_number)

  // ── Terms of subscription (stored as total months) ──────────────────────────
  const termMonths = Number(pick(data.billing, "term_months", "termMonths") ?? 0)
  if (Number.isFinite(termMonths) && termMonths > 0) {
    put("TahunYear_9", Math.floor(termMonths / 12) || "")
    put("BulanMonth_9", termMonths % 12 || "")
  }

  // ── Charges (installation OTC + monthly) ────────────────────────────────────
  const charges: Record<string, any>[] = data.billing?.charges ?? []
  const installation = charges.find(charge => charge.type === "installation")
  if (installation) {
    put("Layanan", installation.description)
    put("Instalasi Port", formatAmount(amount(installation, "port_amount", "portAmount")))
    put("Local Access", formatAmount(amount(installation, "local_access_amount", "localAccessAmount")))
    put("Lain Lain", formatAmount(
      amount(installation, "service_amount", "serviceAmount") + amount(installation, "on_demand_amount", "onDemandAmount") +
      amount(installation, "schedule_amount", "scheduleAmount") + amount(installation, "cpe_amount", "cpeAmount") +
      amount(installation, "other_amount", "otherAmount"),
    ))
    put("Sub total", formatAmount(pick(installation, "subtotal", "subtotal")))
    put("PPNVAT", formatAmount(pick(installation, "vat_amount", "vatAmount")))
    put("undefined_281", formatAmount(pick(installation, "total", "total")))
  }
  const monthly = charges.find(charge => charge.type === "monthly")
  if (monthly) {
    put("Layanan_2", monthly.description)
    put("Port", formatAmount(amount(monthly, "port_amount", "portAmount")))
    put("Local Access_2", formatAmount(amount(monthly, "local_access_amount", "localAccessAmount")))
    put("schedule", formatAmount(amount(monthly, "on_demand_amount", "onDemandAmount") + amount(monthly, "schedule_amount", "scheduleAmount")))
    put("CPE", formatAmount(amount(monthly, "cpe_amount", "cpeAmount")))
    put("Lainlain", formatAmount(amount(monthly, "service_amount", "serviceAmount") + amount(monthly, "other_amount", "otherAmount")))
    put("undefined_306", formatAmount(pick(monthly, "subtotal", "subtotal")))
    put("undefined_307", formatAmount(pick(monthly, "vat_amount", "vatAmount")))
    put("undefined_308", formatAmount(pick(monthly, "total", "total")))
  }

  // ── Billing address, currency, notes ────────────────────────────────────────
  put("Alamat TagihanBilling Address", pick(data.billing, "billing_address", "billingAddress"))
  if (data.billing?.currency) dropdowns["Mata Uang 1"] = String(data.billing.currency)
  put("CatatanNotes", data.notes)

  // ── Document verifications ──────────────────────────────────────────────────
  const documents = data.document_verifications ?? []
  const isVerified = (type: string) =>
    Boolean(documents.find((item: Record<string, any>) => pick(item, "document_type", "documentType") === type)?.verified)
  checks["Fotokopi KTP"] = isVerified("id_card")
  checks["Fotokopi NPWP"] = isVerified("npwp")

  return { text, checks, dropdowns }
}

const normalizeName = (name: string) => name.replace(/\s+/g, "").toLowerCase()

function applyText(form: ReturnType<PDFDocument["getForm"]>, index: Map<string, PDFTextField>, name: string, value: string) {
  // Exact match first (template names that differ only by spaces, e.g. "Lain Lain"
  // vs "Lainlain", must not collide); fall back to a whitespace-insensitive lookup
  // for the service blocks whose field names carry stray spaces.
  let field: PDFTextField | undefined
  try { field = form.getTextField(name) } catch { field = index.get(normalizeName(name)) }
  if (!field) return
  try { field.setText(value) }
  catch {
    // Comb fields reject values longer than their cell count; drop the constraint
    // so long values (FAB number, phone numbers) still render.
    try { field.removeMaxLength(); field.disableCombing(); field.setText(value) } catch { /* give up on this field */ }
  }
}

function applyCheck(form: ReturnType<PDFDocument["getForm"]>, name: string, checked: boolean) {
  try { checked ? form.getCheckBox(name).check() : form.getCheckBox(name).uncheck() } catch { /* optional field */ }
}

function applyDropdown(form: ReturnType<PDFDocument["getForm"]>, name: string, value: string) {
  try {
    const dropdown = form.getDropdown(name)
    const match = dropdown.getOptions().find(option => option.toLowerCase() === value.toLowerCase())
    if (match) dropdown.select(match)
    else { dropdown.addOptions([value]); dropdown.select(value) }
  } catch { /* dropdown missing or value cannot be applied */ }
}

export async function renderFabPdf(data: FabPdfData) {
  const templatePath = path.join(process.cwd(), "src", "lib", "fab", "subscription-form-template.pdf")
  const document = await PDFDocument.load(await readFile(templatePath), { ignoreEncryption: true })
  const form = document.getForm()
  clearFabTemplateFields(form)

  const textIndex = new Map<string, PDFTextField>()
  for (const field of form.getFields()) {
    if (field instanceof PDFTextField) textIndex.set(normalizeName(field.getName()), field)
  }

  const { text, checks, dropdowns } = buildFabFieldValues(data)
  for (const [name, value] of Object.entries(text)) applyText(form, textIndex, name, value)
  for (const [name, value] of Object.entries(dropdowns)) applyDropdown(form, name, value)
  for (const [name, checked] of Object.entries(checks)) applyCheck(form, name, checked)

  for (const field of form.getFields()) if (field instanceof PDFTextField) field.enableMultiline()
  form.updateFieldAppearances()
  form.flatten()
  for (const page of document.getPages()) page.translateContent(FINAL_ARTWORK_OFFSET_X, 0)
  return document.save()
}
