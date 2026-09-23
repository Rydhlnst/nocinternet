import { and, desc, eq, isNull } from "drizzle-orm"
import { getDb } from "@/lib/db"
import {
  auditLogs, fabBillings, fabChargeLines, fabContacts, fabDocumentVerifications,
  fabServiceEndpoints, fabServiceProducts, fabServiceRequests, fabs,
} from "@/lib/db/schema"
import { calculateFabCharge, type FabChargeInput } from "@/lib/fab-validation"

type Db = ReturnType<typeof getDb>
export type FabActor = { id: string; role: string }
export type FabPayload = Record<string, any>

const toDate = (value: string | null | undefined) => value || null
const toNumber = (value: unknown) => Number(value ?? 0)

export function canManageFab(actor: FabActor, fab: { createdBy: string | null }) {
  return actor.role === "admin" || fab.createdBy === actor.id
}

export async function listFabSummaries(db: Db) {
  const rows = await db.select({
    id: fabs.id, fabNumber: fabs.fabNumber, companyName: fabs.companyName, jobType: fabs.jobType,
    requestDate: fabs.requestDate, targetDate: fabs.targetDate, status: fabs.status,
    workflowStatus: fabs.workflowStatus, createdAt: fabs.createdAt, createdBy: fabs.createdBy,
  }).from(fabs).where(isNull(fabs.archivedAt)).orderBy(desc(fabs.createdAt))
  return Promise.all(rows.map(async row => ({
    id: row.id, fab_number: row.fabNumber, company_name: row.companyName, job_type: row.jobType,
    requested_rfs_date: row.targetDate, operational_status: row.status, workflow_status: row.workflowStatus,
    created_at: row.createdAt, service_count: (await db.select({ id: fabServiceRequests.id }).from(fabServiceRequests).where(eq(fabServiceRequests.fabId, row.id))).length,
  })))
}

export async function getFabAggregate(db: Db, id: string) {
  const [fab] = await db.select().from(fabs).where(and(eq(fabs.id, id), isNull(fabs.archivedAt))).limit(1)
  if (!fab) return null
  const services = await db.select().from(fabServiceRequests).where(eq(fabServiceRequests.fabId, id)).orderBy(fabServiceRequests.sequence)
  const serviceData = await Promise.all(services.map(async service => ({
    id: service.id, sequence: service.sequence, site_id: service.siteId, requested_rfs_date: service.requestedRfsDate,
    products: await db.select().from(fabServiceProducts).where(eq(fabServiceProducts.serviceRequestId, service.id)),
    endpoints: await db.select().from(fabServiceEndpoints).where(eq(fabServiceEndpoints.serviceRequestId, service.id)),
    technical_contact: (await db.select().from(fabContacts).where(and(eq(fabContacts.serviceRequestId, service.id), eq(fabContacts.role, "technical"))).limit(1))[0] ?? null,
  })))
  const contacts = await db.select().from(fabContacts).where(eq(fabContacts.fabId, id))
  const [billing] = await db.select().from(fabBillings).where(eq(fabBillings.fabId, id)).limit(1)
  const charges = billing ? await db.select().from(fabChargeLines).where(eq(fabChargeLines.billingId, billing.id)) : []
  const documentVerifications = await db.select().from(fabDocumentVerifications).where(eq(fabDocumentVerifications.fabId, id))
  return {
    id: fab.id, fab_number: fab.fabNumber, workflow_status: fab.workflowStatus, operational_status: fab.status,
    contract_date: fab.contractDate, job_type: fab.jobType, previous_fab_number: fab.previousFabNumber, notes: fab.notes,
    created_by: fab.createdBy, submitted_at: fab.submittedAt, approved_at: fab.approvedAt, declaration_confirmed: fab.declarationConfirmed,
    company: { name: fab.companyName, group: fab.companyGroup, business_type: fab.businessType, address: fab.companyAddress, city: fab.companyCity, province: fab.companyProvinsi, postal_code: fab.postalCode, website: fab.website, email: fab.companyEmail, npwp: fab.npwp, phone: fab.companyPhone },
    applicant: contacts.find(contact => contact.role === "applicant") ?? null,
    financial_contact: contacts.find(contact => contact.role === "financial") ?? null,
    services: serviceData, billing: billing ? { ...billing, charges } : null, document_verifications: documentVerifications,
  }
}

function contactValues(fabId: string, role: string, contact: Record<string, any>, serviceRequestId?: string) {
  return { fabId, serviceRequestId, role, name: contact.name || null, department: contact.department || null, title: contact.title || null, email: contact.email || null, phoneCode: contact.phone_code || null, phoneNumber: contact.phone_number || null, phoneExtension: contact.phone_extension || null, mobileCode: contact.mobile_code || null, mobileNumber: contact.mobile_number || null, birthPlace: contact.birth_place || null, birthDate: toDate(contact.birth_date), idType: contact.id_type || null, idNumber: contact.id_number || null, idExpiry: toDate(contact.id_expiry) }
}

export async function saveFabGraph(db: Db, actor: FabActor, payload: FabPayload, existingId?: string) {
  return db.transaction(async tx => {
    if (existingId) {
      await tx.delete(fabDocumentVerifications).where(eq(fabDocumentVerifications.fabId, existingId))
      const [existingBilling] = await tx.select().from(fabBillings).where(eq(fabBillings.fabId, existingId)).limit(1)
      if (existingBilling) await tx.delete(fabChargeLines).where(eq(fabChargeLines.billingId, existingBilling.id))
      await tx.delete(fabBillings).where(eq(fabBillings.fabId, existingId))
      await tx.delete(fabContacts).where(eq(fabContacts.fabId, existingId))
      await tx.delete(fabServiceRequests).where(eq(fabServiceRequests.fabId, existingId))
    }
    const values = {
      fabNumber: payload.fab_number, status: payload.operational_status, workflowStatus: payload.workflow_status,
      contractDate: toDate(payload.contract_date), jobType: payload.job_type || null, previousFabNumber: payload.previous_fab_number || null,
      companyName: payload.company?.name || null, companyGroup: payload.company?.group || null, businessType: payload.company?.business_type || null,
      companyAddress: payload.company?.address || null, companyCity: payload.company?.city || null, companyProvinsi: payload.company?.province || null,
      postalCode: payload.company?.postal_code || null, website: payload.company?.website || null, companyEmail: payload.company?.email || null, npwp: payload.company?.npwp || null, companyPhone: payload.company?.phone || null,
      siteId: payload.services?.[0]?.site_id || null, targetDate: toDate(payload.services?.[0]?.requested_rfs_date), notes: payload.notes || null,
      declarationConfirmed: Boolean(payload.declaration_confirmed), createdBy: existingId ? undefined : actor.id,
      submittedAt: payload.workflow_status === "submitted" ? new Date() : null,
    }
    const [fab] = existingId
      ? await tx.update(fabs).set(values).where(eq(fabs.id, existingId)).returning()
      : await tx.insert(fabs).values(values).returning()
    if (!fab) throw new Error("FAB could not be saved")
    if (payload.applicant) await tx.insert(fabContacts).values(contactValues(fab.id, "applicant", payload.applicant))
    if (payload.financial_contact) await tx.insert(fabContacts).values(contactValues(fab.id, "financial", payload.financial_contact))
    for (const service of payload.services ?? []) {
      const [savedService] = await tx.insert(fabServiceRequests).values({ fabId: fab.id, sequence: service.sequence, siteId: service.site_id || null, requestedRfsDate: toDate(service.requested_rfs_date) }).returning()
      if (!savedService) throw new Error("Service request could not be saved")
      if (service.technical_contact) await tx.insert(fabContacts).values(contactValues(fab.id, "technical", service.technical_contact, savedService.id))
      if (service.products?.length) await tx.insert(fabServiceProducts).values(service.products.map((product: Record<string, any>) => ({ serviceRequestId: savedService.id, category: product.category, product: product.product, package: product.package || null, unit: product.unit, quantity: String(product.quantity), deliveryScope: product.delivery_scope || null, uplinkRequired: Boolean(product.uplink_required), spaceM2: product.space_m2 == null ? null : String(product.space_m2), rackU: product.rack_u == null ? null : String(product.rack_u), powerKva: product.power_kva == null ? null : String(product.power_kva) })))
      if (service.endpoints?.length) await tx.insert(fabServiceEndpoints).values(service.endpoints.map((endpoint: Record<string, any>) => ({ serviceRequestId: savedService.id, role: endpoint.role, country: endpoint.country, overseasCarrier: endpoint.overseas_carrier || null, companyName: endpoint.company_name, address: endpoint.address, latitude: String(endpoint.latitude), longitude: String(endpoint.longitude), picName: endpoint.pic_name || null, phone: endpoint.phone || null, email: endpoint.email || null })))
    }
    if (payload.billing) {
      const [billing] = await tx.insert(fabBillings).values({ fabId: fab.id, termMonths: payload.billing.term_months, billingAddress: payload.billing.billing_address, currency: payload.billing.currency, vatRate: String(payload.billing.vat_rate) }).returning()
      if (!billing) throw new Error("Billing could not be saved")
      const charges = (payload.billing.charges ?? []).map((charge: FabChargeInput) => {
        const totals = calculateFabCharge(charge, toNumber(payload.billing.vat_rate))
        return { billingId: billing.id, type: charge.type, description: charge.description || null, serviceAmount: String(charge.service_amount), portAmount: String(charge.port_amount), localAccessAmount: String(charge.local_access_amount), onDemandAmount: String(charge.on_demand_amount), scheduleAmount: String(charge.schedule_amount), cpeAmount: String(charge.cpe_amount), otherAmount: String(charge.other_amount), subtotal: String(totals.subtotal), vatAmount: String(totals.vat_amount), total: String(totals.total) }
      })
      if (charges.length) await tx.insert(fabChargeLines).values(charges)
    }
    if (payload.document_verifications?.length) await tx.insert(fabDocumentVerifications).values(payload.document_verifications.map((document: Record<string, any>) => ({ fabId: fab.id, documentType: document.document_type, verified: Boolean(document.verified), verifiedAt: document.verified ? new Date() : null, verifiedBy: document.verified && actor.role === "admin" ? actor.id : null })))
    await tx.insert(auditLogs).values({ userId: actor.id, action: existingId ? "update_fab_draft" : "create_fab_draft", module: "fabs", recordId: fab.id })
    return fab
  })
}

export function redactFabForStaff<T extends Record<string, any>>(data: T): T {
  const mask = (value: unknown) => { const text = String(value ?? ""); return text.length > 4 ? `${"*".repeat(Math.max(0, text.length - 4))}${text.slice(-4)}` : text }
  const applicant = data.applicant ? { ...data.applicant, idNumber: mask(data.applicant.idNumber), id_number: data.applicant.id_number ? mask(data.applicant.id_number) : undefined } : data.applicant
  const billing = data.billing ? { ...data.billing, charges: (data.billing.charges ?? []).map((charge: Record<string, unknown>) => ({ ...charge, serviceAmount: undefined, portAmount: undefined, localAccessAmount: undefined, onDemandAmount: undefined, scheduleAmount: undefined, cpeAmount: undefined, otherAmount: undefined, subtotal: undefined, vatAmount: undefined, total: undefined, service_amount: undefined, port_amount: undefined, local_access_amount: undefined, on_demand_amount: undefined, schedule_amount: undefined, cpe_amount: undefined, other_amount: undefined, subtotal_amount: undefined, vat_amount: undefined, total_amount: undefined })) } : data.billing
  return { ...data, applicant, billing }
}