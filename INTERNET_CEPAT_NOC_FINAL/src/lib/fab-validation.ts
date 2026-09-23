import { z } from "zod"

const optionalText = z.string().trim().max(500).optional().nullable()
const optionalDate = z.string().date().optional().nullable()
const positiveAmount = z.coerce.number().finite().min(0)

export const WORKFLOW_STATUSES = ["draft", "submitted", "approved"] as const
export const OPERATIONAL_STATUSES = ["Open", "In Progress", "RFS", "Completed", "Cancelled"] as const
export const SERVICE_CATEGORIES = ["connectivity", "internet", "satellite", "collocation", "add_on"] as const
export const SERVICE_PRODUCTS = ["Leased Circuit", "Ethernet Link", "IPVPN Link", "Leased Core", "Dedicated", "IP Transit", "Broadband", "OTT Peering", "CDN Peering", "Transponder", "Media Hub", "Manage Service", "Anti DDoS", "Flexible Add On", "Collocation"] as const

export const fabContactSchema = z.object({
  name: z.string().trim().min(1).max(150),
  department: optionalText,
  title: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  phone_code: optionalText,
  phone_number: optionalText,
  phone_extension: optionalText,
  mobile_code: optionalText,
  mobile_number: optionalText,
  birth_place: optionalText,
  birth_date: optionalDate,
  id_type: optionalText,
  id_number: optionalText,
  id_expiry: optionalDate,
})

const draftContactSchema = fabContactSchema.partial()

export const fabProductSchema = z.object({
  category: z.enum(SERVICE_CATEGORIES),
  product: z.enum(SERVICE_PRODUCTS),
  package: optionalText,
  unit: z.string().trim().min(1).max(30),
  quantity: z.coerce.number().finite().positive().max(1000000),
  delivery_scope: z.enum(["Domestic", "International"]).optional(),
  uplink_required: z.boolean().optional(),
  space_m2: positiveAmount.optional(),
  rack_u: positiveAmount.optional(),
  power_kva: positiveAmount.optional(),
})

const fabEndpointSchema = z.object({
  role: z.enum(["origin", "destination"]),
  country: z.string().trim().min(1).max(100),
  overseas_carrier: optionalText,
  company_name: z.string().trim().min(1).max(200),
  address: z.string().trim().min(1).max(500),
  latitude: z.coerce.number().finite().min(-90).max(90),
  longitude: z.coerce.number().finite().min(-180).max(180),
  pic_name: optionalText,
  phone: optionalText,
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
})

export const fabServiceSchema = z.object({
  id: z.string().uuid().optional(),
  sequence: z.coerce.number().int().min(1).max(5),
  site_id: z.string().uuid().optional().nullable(),
  requested_rfs_date: z.string().date(),
  technical_contact: fabContactSchema,
  products: z.array(fabProductSchema).min(1).max(20),
  endpoints: z.array(fabEndpointSchema).length(2).superRefine((value, ctx) => {
    if (!value.some(endpoint => endpoint.role === "origin")) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Origin endpoint is required" })
    if (!value.some(endpoint => endpoint.role === "destination")) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Destination endpoint is required" })
  }),
})

export const fabChargeSchema = z.object({
  type: z.enum(["installation", "monthly"]),
  service_amount: positiveAmount.optional().default(0),
  port_amount: positiveAmount.optional().default(0),
  local_access_amount: positiveAmount.optional().default(0),
  on_demand_amount: positiveAmount.optional().default(0),
  schedule_amount: positiveAmount.optional().default(0),
  cpe_amount: positiveAmount.optional().default(0),
  other_amount: positiveAmount.optional().default(0),
  description: optionalText,
})

export const fabBillingSchema = z.object({
  term_months: z.coerce.number().int().min(1).max(120),
  billing_address: z.string().trim().min(1).max(500),
  currency: z.literal("IDR"),
  vat_rate: z.coerce.number().min(0).max(100),
  charges: z.array(fabChargeSchema).min(1).max(10),
})

const documentSchema = z.object({ document_type: z.enum(["id_card", "npwp"]), verified: z.boolean() })
const completeCompany = z.object({
  name: z.string().trim().min(1).max(200), group: optionalText, business_type: optionalText,
  address: z.string().trim().min(1).max(500), city: optionalText, province: optionalText,
  postal_code: optionalText, website: optionalText,
  email: z.string().trim().email().max(200).optional().or(z.literal("")), npwp: optionalText, phone: optionalText,
})

const fabDraftServiceSchema = z.object({ id: z.string().uuid().optional(), sequence: z.coerce.number().int().min(1).max(5), site_id: z.string().uuid().optional().nullable(), requested_rfs_date: z.string().optional(), technical_contact: draftContactSchema.optional(), products: z.array(fabProductSchema.partial()).max(20).optional(), endpoints: z.array(fabEndpointSchema.partial()).max(2).optional() })

export const fabDraftSchema = z.object({
  fab_number: z.string().trim().min(1).max(100), workflow_status: z.enum(WORKFLOW_STATUSES), operational_status: z.enum(OPERATIONAL_STATUSES),
  contract_date: optionalDate, job_type: optionalText, previous_fab_number: optionalText,
  company: completeCompany.partial().optional(), applicant: draftContactSchema.optional(), financial_contact: draftContactSchema.optional(),
  services: z.array(fabDraftServiceSchema).max(5).optional(), billing: fabBillingSchema.optional(), document_verifications: z.array(documentSchema).max(2).optional(),
  declaration_confirmed: z.boolean().optional(), notes: z.string().max(2000).optional().nullable(),
})

export const fabSubmissionSchema = fabDraftSchema.extend({
  workflow_status: z.literal("submitted"), contract_date: z.string().date(), job_type: z.string().trim().min(1).max(100),
  company: completeCompany, applicant: fabContactSchema, financial_contact: fabContactSchema,
  services: z.array(fabServiceSchema).min(1).max(5), billing: fabBillingSchema,
  document_verifications: z.array(documentSchema).length(2).refine(items => items.every(item => item.verified), "ID card and NPWP must be verified"),
  declaration_confirmed: z.literal(true),
})

export type FabChargeInput = z.infer<typeof fabChargeSchema>
export function calculateFabCharge(charge: FabChargeInput, vatRate: number) {
  const subtotal = [charge.service_amount, charge.port_amount, charge.local_access_amount, charge.on_demand_amount, charge.schedule_amount, charge.cpe_amount, charge.other_amount].reduce((total, value) => total + Number(value ?? 0), 0)
  const vatAmount = Math.round(subtotal * (vatRate / 100))
  return { subtotal, vat_amount: vatAmount, total: subtotal + vatAmount }
}
