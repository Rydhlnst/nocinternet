import { z } from "zod"
import type { Resource } from "@/lib/types"

const optionalText = (max: number) => z.string().max(max).optional()
const optionalDate = z.string().date("Gunakan tanggal dengan format YYYY-MM-DD").nullable().optional()
const base = { site_id: z.string().uuid("Pilih site yang valid"), status: z.string().min(1, "Status wajib dipilih").max(40), notes: z.string().max(2000, "Catatan maksimal 2.000 karakter").nullable().optional() }

// ── FAB wizard per-step schemas ───────────────────────────────────────────────
export const fabStep1Schema = z.object({
  fab_number: z.string().trim().min(1, "Nomor FAB/SO wajib diisi").max(100),
  contract_date: optionalDate,
  job_type: z.string().min(1, "Jenis pekerjaan wajib dipilih").max(100),
  previous_fab_number: optionalText(100),
})

export const fabStep2Schema = z.object({
  company_name: z.string().trim().min(1, "Nama perusahaan wajib diisi").max(200),
  company_group: optionalText(200),
  business_type: optionalText(100),
  company_address: z.string().max(500).optional(),
  company_city: optionalText(100),
  company_provinsi: optionalText(100),
  postal_code: optionalText(10),
  website: optionalText(200),
  company_email: z.string().max(200).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid").optional(),
  npwp: optionalText(30),
  company_phone: optionalText(30),
})

export const fabStep3Schema = z.object({
  pic_name: z.string().trim().min(1, "Nama PIC wajib diisi").max(150),
  pic_birth_place: optionalText(100),
  pic_birth_date: optionalDate,
  pic_position: z.string().trim().min(1, "Jabatan PIC wajib diisi").max(100),
  pic_phone_code: optionalText(5),
  pic_phone_number: optionalText(20),
  pic_mobile_code: optionalText(5),
  pic_mobile_number: optionalText(20),
  pic_id_type: optionalText(50),
  pic_id_number: optionalText(50),
  pic_id_expiry: optionalDate,
})

export const fabStep4Schema = z.object({
  service_type: z.string().trim().min(1, "Jenis layanan wajib dipilih").max(100),
  bandwidth_up: optionalText(50),
  bandwidth_down: optionalText(50),
  billing_type: optionalText(50),
  ip_type: optionalText(50),
  ip_address: optionalText(100),
  sla_level: optionalText(50),
})

export const fabStep5Schema = z.object({
  site_id: z.string().uuid("Pilih site yang valid"),
  install_address: z.string().max(500).optional(),
  install_city: optionalText(100),
  install_provinsi: optionalText(100),
})

export const fabStep6Schema = z.object({
  status: z.string().min(1, "Status wajib dipilih").max(40),
  request_date: optionalDate,
  target_date: optionalDate,
  rfs_date: optionalDate,
  completion_date: optionalDate,
  pic: optionalText(150),
  notes: z.string().max(2000, "Catatan maksimal 2.000 karakter").nullable().optional(),
})

export const FAB_STEP_SCHEMAS = [fabStep1Schema, fabStep2Schema, fabStep3Schema, fabStep4Schema, fabStep5Schema, fabStep6Schema]

// Full FAB schema used by the API (all step 2-5 fields optional for backward compat)
const fabApiSchema = z.object({
  fab_number: z.string().trim().min(1, "Nomor FAB/SO wajib diisi").max(100),
  site_id: z.string().uuid("Pilih site yang valid"),
  status: z.string().min(1, "Status wajib dipilih").max(40),
  notes: z.string().max(2000).nullable().optional(),
  contract_date: optionalDate, job_type: optionalText(100), previous_fab_number: optionalText(100),
  company_name: optionalText(200), company_group: optionalText(200), business_type: optionalText(100),
  company_address: z.string().max(500).optional(), company_city: optionalText(100), company_provinsi: optionalText(100),
  postal_code: optionalText(10), website: optionalText(200),
  company_email: z.string().max(200).refine(v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Format email tidak valid").optional(),
  npwp: optionalText(30), company_phone: optionalText(30),
  pic_name: optionalText(150), pic_birth_place: optionalText(100), pic_birth_date: optionalDate,
  pic_position: optionalText(100), pic_phone_code: optionalText(5), pic_phone_number: optionalText(20),
  pic_mobile_code: optionalText(5), pic_mobile_number: optionalText(20),
  pic_id_type: optionalText(50), pic_id_number: optionalText(50), pic_id_expiry: optionalDate,
  service_type: optionalText(100), bandwidth_up: optionalText(50), bandwidth_down: optionalText(50),
  billing_type: optionalText(50), ip_type: optionalText(50), ip_address: optionalText(100), sla_level: optionalText(50),
  install_address: z.string().max(500).optional(), install_city: optionalText(100), install_provinsi: optionalText(100),
  rfs_date: optionalDate, request_date: optionalDate, target_date: optionalDate, completion_date: optionalDate,
  pic: optionalText(150),
})

export const schemas: Record<Exclude<Resource, "sites">, z.ZodObject<Record<string, z.ZodTypeAny>>> = {
  cids: z.object({ ...base, cid_number: z.string().trim().min(1, "Nomor CID wajib diisi").max(100), customer: optionalText(200), service_type: optionalText(100), bandwidth: optionalText(100), vlan: optionalText(50), ip_address: optionalText(100), activation_date: optionalDate, pic: optionalText(150) }),
  fabs: fabApiSchema as unknown as z.ZodObject<Record<string, z.ZodTypeAny>>,
  upgrades: z.object({ ...base, cid_id: z.string().uuid().optional(), current_bandwidth: z.string().trim().min(1, "Bandwidth saat ini wajib diisi").max(100), requested_bandwidth: z.string().trim().min(1, "Bandwidth permintaan wajib diisi").max(100), request_date: optionalDate, target_date: optionalDate, completion_date: optionalDate, pic: optionalText(150) }),
  maintenance: z.object({ ...base, cid_id: z.string().uuid().optional(), maintenance_type: z.string().trim().min(1, "Jenis maintenance wajib diisi").max(120), scheduled_at: optionalDate, started_at: optionalDate, completed_at: optionalDate, impact: optionalText(300), pic_vendor: optionalText(150) }),
}

export const siteSchema = z.object({ nama_site: z.string().trim().min(1, "Nama site wajib diisi").max(160), site_id: z.string().trim().min(1, "Site ID wajib diisi").max(80), provinsi: z.string().trim().min(1, "Provinsi wajib diisi").max(100), kota_kabupaten: z.string().trim().min(1, "Kota/Kabupaten wajib diisi").max(100), vlan: optionalText(50), kapasitas_bandwidth: optionalText(100), media_akses: optionalText(100), pic_customer: optionalText(150), no_telp_pic: optionalText(40), pic_isp: optionalText(150), tanggal_aktivasi: optionalDate, status_layanan: z.string().min(1, "Status layanan wajib dipilih").max(40), keterangan: z.string().max(2000, "Keterangan maksimal 2.000 karakter").nullable().optional() })
export const userSchema = z.object({ email: z.string().trim().email("Masukkan email yang valid, contoh: nama@perusahaan.co.id"), password: z.string().min(8, "Password minimal 8 karakter").regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf kapital").regex(/[0-9]/, "Password harus memiliki minimal 1 angka"), full_name: z.string().trim().min(1, "Nama wajib diisi").max(120), role: z.enum(["admin", "staff"], { errorMap: () => ({ message: "Role harus Admin atau Staff" }) }) })

export function validationMessage(details: unknown) {
  const fieldErrors = (details as { fieldErrors?: Record<string, string[]> } | null)?.fieldErrors
  if (!fieldErrors) return "Periksa kembali data yang diisi."
  const [field, messages] = Object.entries(fieldErrors).find(([, values]) => values?.length) ?? []
  return field && messages?.[0] ? `${field.replaceAll("_", " ")}: ${messages[0]}.` : "Periksa kembali data yang diisi."
}
