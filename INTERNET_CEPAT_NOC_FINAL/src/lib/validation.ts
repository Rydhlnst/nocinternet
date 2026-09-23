import { z } from "zod"
import type { Resource } from "@/lib/types"

const optionalText = (max: number) => z.string().max(max).optional()
const optionalDate = z.string().date("Gunakan tanggal dengan format YYYY-MM-DD").nullable().optional()
const base = { site_id: z.string().uuid("Pilih site yang valid"), status: z.string().min(1, "Status wajib dipilih").max(40), notes: z.string().max(2000, "Catatan maksimal 2.000 karakter").nullable().optional() }

export const schemas: Record<Exclude<Resource, "sites">, z.ZodObject<Record<string, z.ZodTypeAny>>> = {
  cids: z.object({ ...base, cid_number: z.string().trim().min(1, "Nomor CID wajib diisi").max(100), customer: optionalText(200), service_type: optionalText(100), bandwidth: optionalText(100), vlan: optionalText(50), ip_address: optionalText(100), activation_date: optionalDate, pic: optionalText(150) }),
  fabs: z.object({ ...base, fab_number: z.string().trim().min(1, "Nomor FAB/SO wajib diisi").max(100), request_date: optionalDate, target_date: optionalDate, completion_date: optionalDate, pic: optionalText(150) }),
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
