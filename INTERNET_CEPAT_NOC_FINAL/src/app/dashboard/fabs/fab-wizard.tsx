"use client"

import React, { useEffect, useState } from "react"
import {
  RiFileList3Line, RiBuildingLine, RiUserLine, RiWifiLine,
  RiMapPin2Line, RiCalendarCheckLine, RiArrowRightLine, RiArrowLeftLine, RiCloseLine, RiCheckLine,
} from "react-icons/ri"
import { useToast } from "@/components/toast"
import { FAB_STEP_SCHEMAS } from "@/lib/validation"

type Row = Record<string, unknown>

// ── Constants ──────────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Informasi Kontrak", icon: <RiFileList3Line size={13} /> },
  { id: 2, label: "Informasi Perusahaan", icon: <RiBuildingLine size={13} /> },
  { id: 3, label: "PIC & Kontak", icon: <RiUserLine size={13} /> },
  { id: 4, label: "Jenis Layanan", icon: <RiWifiLine size={13} /> },
  { id: 5, label: "Lokasi & Teknis", icon: <RiMapPin2Line size={13} /> },
  { id: 6, label: "RFS & Dokumen", icon: <RiCalendarCheckLine size={13} /> },
]

const JOB_TYPES = ["Pasang Baru", "Upgrade", "Pindah Lokasi", "Cabut", "Perubahan Layanan"]
const PROVINCES = ["Aceh","Bali","Banten","Bengkulu","D.I. Yogyakarta","D.K.I. Jakarta","Gorontalo","Jambi","Jawa Barat","Jawa Tengah","Jawa Timur","Kalimantan Barat","Kalimantan Selatan","Kalimantan Tengah","Kalimantan Timur","Kalimantan Utara","Kepulauan Bangka Belitung","Kepulauan Riau","Lampung","Maluku","Maluku Utara","Nusa Tenggara Barat","Nusa Tenggara Timur","Papua","Papua Barat","Papua Barat Daya","Papua Pegunungan","Papua Selatan","Papua Tengah","Riau","Sulawesi Barat","Sulawesi Selatan","Sulawesi Tengah","Sulawesi Tenggara","Sulawesi Utara","Sumatera Barat","Sumatera Selatan","Sumatera Utara"]
const SERVICE_TYPES = ["Internet Dedicated", "IPVPN", "MPLS", "Metro Ethernet", "Colocation", "Lainnya"]
const BILLING_TYPES = ["Bulanan", "Triwulan", "Semesteran", "Tahunan"]
const IP_TYPES = ["IP Statik", "IP Dinamis"]
const ID_TYPES = ["KTP", "Paspor", "SIM", "KITAS"]
const SLA_LEVELS = ["99.5%", "99.9%", "99.95%", "99.99%"]
const FAB_STATUSES = ["Open", "In Progress", "Completed", "Cancelled", "On Hold"]

type SiteOption = { id: string; site_id: string; nama_site: string }

// ── Helper components ──────────────────────────────────────────────────────────

function FabField({ label, required, error, children, wide }: { label: string; required?: boolean; error?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`fab-field${wide ? " wide" : ""}`}>
      <span className={`fab-label${required ? " req" : ""}`}>{label}</span>
      {children}
      {error && <span className="fab-field-error">{error}</span>}
    </div>
  )
}

function FabSelect({ name, value, onChange, children, placeholder }: { name?: string; value: string; onChange: (v: string) => void; children: React.ReactNode; placeholder?: string }) {
  return (
    <select name={name} className="input" style={{ height: 40, fontSize: 13 }} value={value} onChange={e => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  )
}

function FabInput({ name, value, onChange, placeholder, type }: { name?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input name={name} className="input" style={{ height: 40, fontSize: 13 }} type={type ?? "text"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  )
}

function SitePicker({ initialSiteId, onChange }: { initialSiteId?: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<SiteOption[]>([])
  const [selected, setSelected] = useState<SiteOption | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!initialSiteId) return
    fetch(`/api/sites/${initialSiteId}`).then(r => r.json()).then((json: { data?: SiteOption }) => {
      if (json.data) { setSelected(json.data); onChange(json.data.id) }
    }).catch(() => {})
  }, [initialSiteId])

  async function search(value: string) {
    setQuery(value)
    const res = await fetch(`/api/sites?q=${encodeURIComponent(value)}&limit=20`)
    const json = await res.json() as { data?: SiteOption[] }
    setOptions(json.data ?? [])
    setOpen(true)
  }

  function pick(site: SiteOption) { setSelected(site); onChange(site.id); setQuery(""); setOpen(false); setOptions([]) }
  function clear() { setSelected(null); onChange(""); setQuery(""); setOptions([]); setOpen(false) }

  return selected ? (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <div className="input" style={{ flex: 1, height: 40, display: "flex", alignItems: "center", fontSize: 13 }}>
        <span style={{ fontWeight: 600 }}>{selected.site_id}</span>
        <span style={{ color: "var(--muted)", marginLeft: 8 }}>— {selected.nama_site}</span>
      </div>
      <button type="button" className="btn btn-secondary" style={{ height: 40, fontSize: 12 }} onClick={clear}>Ganti</button>
    </div>
  ) : (
    <div style={{ position: "relative" }}>
      <input className="input" style={{ height: 40, fontSize: 13 }} placeholder="Ketik nama site atau Site ID..." value={query} autoComplete="off"
        onChange={e => void search(e.target.value)}
        onFocus={() => { if (options.length === 0) void search(query) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && options.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 8, zIndex: 20, maxHeight: 200, overflow: "auto", boxShadow: "0 6px 20px rgba(27,35,43,.1)" }}>
          {options.map(site => (
            <button key={site.id} type="button" onMouseDown={() => pick(site)}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", border: "none", borderBottom: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{site.site_id}</span>
              <span style={{ color: "var(--muted)", marginLeft: 8 }}>{site.nama_site}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step forms ─────────────────────────────────────────────────────────────────

function Step1({ data, errors, onNext, onBack: _onBack, onClose }: { data: Row; errors: Record<string, string>; onNext: (d: Row) => void; onBack?: () => void; onClose: () => void }) {
  const [d, setD] = useState({ fab_number: String(data.fab_number ?? ""), contract_date: String(data.contract_date ?? ""), job_type: String(data.job_type ?? ""), previous_fab_number: String(data.previous_fab_number ?? "") })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiFileList3Line size={16} /></div>
          Informasi Kontrak
        </div>
        <div className="fab-grid-2">
          <FabField label="No. FAB / SO" required error={errors.fab_number}>
            <FabInput value={d.fab_number} onChange={set("fab_number")} placeholder="Contoh: FAB-0001" />
          </FabField>
          <FabField label="Tanggal Penandatanganan Kontrak" error={errors.contract_date}>
            <FabInput value={d.contract_date} onChange={set("contract_date")} type="date" />
          </FabField>
          <FabField label="Jenis Pekerjaan / Type of Order" required error={errors.job_type}>
            <FabSelect value={d.job_type} onChange={set("job_type")} placeholder="Pilih Jenis Pekerjaan">
              {JOB_TYPES.map(j => <option key={j} value={j}>{j}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="No. FAB Sebelumnya (bila ada)" error={errors.previous_fab_number}>
            <FabInput value={d.previous_fab_number} onChange={set("previous_fab_number")} placeholder="Previous FAB Number" />
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-primary" onClick={() => onNext(d)}>
            Lanjut <RiArrowRightLine size={14} />
          </button>
        </div>
      </div>
    </>
  )
}

function Step2({ data, errors, onNext, onBack, onClose }: { data: Row; errors: Record<string, string>; onNext: (d: Row) => void; onBack: () => void; onClose: () => void }) {
  const [d, setD] = useState({
    company_name: String(data.company_name ?? ""), company_group: String(data.company_group ?? ""),
    business_type: String(data.business_type ?? ""), company_address: String(data.company_address ?? ""),
    company_city: String(data.company_city ?? ""), company_provinsi: String(data.company_provinsi ?? ""),
    postal_code: String(data.postal_code ?? ""), website: String(data.website ?? ""),
    company_email: String(data.company_email ?? ""), npwp: String(data.npwp ?? ""),
    company_phone: String(data.company_phone ?? ""),
  })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiBuildingLine size={16} /></div>
          Informasi Perusahaan / Company Information
        </div>
        <div className="fab-grid-2">
          <FabField label="Nama Perusahaan" required error={errors.company_name}>
            <FabInput value={d.company_name} onChange={set("company_name")} placeholder="Nama Perusahaan" />
          </FabField>
          <FabField label="Grup Perusahaan" error={errors.company_group}>
            <FabInput value={d.company_group} onChange={set("company_group")} placeholder="Grup Perusahaan" />
          </FabField>
          <FabField label="Jenis Usaha" error={errors.business_type}>
            <FabInput value={d.business_type} onChange={set("business_type")} placeholder="Contoh: Perbankan, Retail" />
          </FabField>
          <FabField label="NPWP" error={errors.npwp}>
            <FabInput value={d.npwp} onChange={set("npwp")} placeholder="Nomor NPWP" />
          </FabField>
          <FabField label="Alamat" error={errors.company_address} wide>
            <textarea className="textarea" style={{ fontSize: 13, minHeight: 72 }} value={d.company_address} onChange={e => set("company_address")(e.target.value)} placeholder="Alamat lengkap perusahaan" />
          </FabField>
          <FabField label="Kota" error={errors.company_city}>
            <FabInput value={d.company_city} onChange={set("company_city")} placeholder="Kota" />
          </FabField>
          <FabField label="Provinsi" error={errors.company_provinsi}>
            <FabSelect value={d.company_provinsi} onChange={set("company_provinsi")} placeholder="Pilih Provinsi">
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="Kode Pos" error={errors.postal_code}>
            <FabInput value={d.postal_code} onChange={set("postal_code")} placeholder="Kode Pos" />
          </FabField>
          <FabField label="Web / Website" error={errors.website}>
            <FabInput value={d.website} onChange={set("website")} placeholder="https://" />
          </FabField>
          <FabField label="Email" error={errors.company_email}>
            <FabInput value={d.company_email} onChange={set("company_email")} type="email" placeholder="nama@perusahaan.com" />
          </FabField>
          <FabField label="Telepon" error={errors.company_phone}>
            <FabInput value={d.company_phone} onChange={set("company_phone")} placeholder="Nomor Telepon" />
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}><RiArrowLeftLine size={14} /> Kembali</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={() => onNext(d)}>Lanjut <RiArrowRightLine size={14} /></button>
        </div>
      </div>
    </>
  )
}

function Step3({ data, errors, onNext, onBack, onClose }: { data: Row; errors: Record<string, string>; onNext: (d: Row) => void; onBack: () => void; onClose: () => void }) {
  const [d, setD] = useState({
    pic_name: String(data.pic_name ?? ""), pic_birth_place: String(data.pic_birth_place ?? ""),
    pic_birth_date: String(data.pic_birth_date ?? ""), pic_position: String(data.pic_position ?? ""),
    pic_phone_code: String(data.pic_phone_code ?? "+62"), pic_phone_number: String(data.pic_phone_number ?? ""),
    pic_mobile_code: String(data.pic_mobile_code ?? "+62"), pic_mobile_number: String(data.pic_mobile_number ?? ""),
    pic_id_type: String(data.pic_id_type ?? ""), pic_id_number: String(data.pic_id_number ?? ""),
    pic_id_expiry: String(data.pic_id_expiry ?? ""),
  })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiUserLine size={16} /></div>
          Person In Charge (PIC)
        </div>
        <div className="fab-grid-2">
          <FabField label="Nama Lengkap" required error={errors.pic_name}>
            <FabInput value={d.pic_name} onChange={set("pic_name")} placeholder="Nama PIC" />
          </FabField>
          <FabField label="Tempat & Tanggal Lahir" error={errors.pic_birth_date}>
            <div style={{ display: "flex", gap: 8 }}>
              <FabInput value={d.pic_birth_place} onChange={set("pic_birth_place")} placeholder="Tempat lahir" />
              <input className="input" style={{ height: 40, fontSize: 13, flexShrink: 0, width: 152 }} type="date" value={d.pic_birth_date} onChange={e => set("pic_birth_date")(e.target.value)} />
            </div>
          </FabField>
          <FabField label="Jabatan" required error={errors.pic_position}>
            <FabInput value={d.pic_position} onChange={set("pic_position")} placeholder="Jabatan" />
          </FabField>
          <FabField label="Telepon" error={errors.pic_phone_number}>
            <div className="fab-phone-group">
              <input className="input fab-phone-code" style={{ height: 40, fontSize: 13 }} value={d.pic_phone_code} onChange={e => set("pic_phone_code")(e.target.value)} placeholder="+62" />
              <FabInput value={d.pic_phone_number} onChange={set("pic_phone_number")} placeholder="Nomor Telepon" />
            </div>
          </FabField>
          <FabField label="Mobile Phone" error={errors.pic_mobile_number}>
            <div className="fab-phone-group">
              <input className="input fab-phone-code" style={{ height: 40, fontSize: 13 }} value={d.pic_mobile_code} onChange={e => set("pic_mobile_code")(e.target.value)} placeholder="+62" />
              <FabInput value={d.pic_mobile_number} onChange={set("pic_mobile_number")} placeholder="Nomor Mobile" />
            </div>
          </FabField>
          <FabField label="Masa Berlaku Identitas" error={errors.pic_id_expiry}>
            <input className="input" style={{ height: 40, fontSize: 13 }} type="date" value={d.pic_id_expiry} onChange={e => set("pic_id_expiry")(e.target.value)} />
          </FabField>
          <FabField label="Jenis Kartu Identitas" error={errors.pic_id_type}>
            <FabSelect value={d.pic_id_type} onChange={set("pic_id_type")} placeholder="Pilih Jenis">
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="Nomor Identitas" error={errors.pic_id_number}>
            <FabInput value={d.pic_id_number} onChange={set("pic_id_number")} placeholder="Nomor Identitas" />
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}><RiArrowLeftLine size={14} /> Kembali</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={() => onNext(d)}>Lanjut <RiArrowRightLine size={14} /></button>
        </div>
      </div>
    </>
  )
}

function Step4({ data, errors, onNext, onBack, onClose }: { data: Row; errors: Record<string, string>; onNext: (d: Row) => void; onBack: () => void; onClose: () => void }) {
  const [d, setD] = useState({
    service_type: String(data.service_type ?? ""), bandwidth_up: String(data.bandwidth_up ?? ""),
    bandwidth_down: String(data.bandwidth_down ?? ""), billing_type: String(data.billing_type ?? ""),
    ip_type: String(data.ip_type ?? ""), ip_address: String(data.ip_address ?? ""),
    sla_level: String(data.sla_level ?? ""),
  })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiWifiLine size={16} /></div>
          Jenis Layanan
        </div>
        <div className="fab-grid-2">
          <FabField label="Jenis Layanan" required error={errors.service_type}>
            <FabSelect value={d.service_type} onChange={set("service_type")} placeholder="Pilih Jenis Layanan">
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="Tipe Billing" error={errors.billing_type}>
            <FabSelect value={d.billing_type} onChange={set("billing_type")} placeholder="Pilih Billing">
              {BILLING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="Bandwidth Up" error={errors.bandwidth_up}>
            <FabInput value={d.bandwidth_up} onChange={set("bandwidth_up")} placeholder="Contoh: 100 Mbps" />
          </FabField>
          <FabField label="Bandwidth Down" error={errors.bandwidth_down}>
            <FabInput value={d.bandwidth_down} onChange={set("bandwidth_down")} placeholder="Contoh: 100 Mbps" />
          </FabField>
          <FabField label="Tipe IP" error={errors.ip_type}>
            <FabSelect value={d.ip_type} onChange={set("ip_type")} placeholder="Pilih Tipe IP">
              {IP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="IP Address / Range" error={errors.ip_address}>
            <FabInput value={d.ip_address} onChange={set("ip_address")} placeholder="Contoh: 192.168.1.0/24" />
          </FabField>
          <FabField label="SLA Level" error={errors.sla_level}>
            <FabSelect value={d.sla_level} onChange={set("sla_level")} placeholder="Pilih SLA">
              {SLA_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </FabSelect>
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}><RiArrowLeftLine size={14} /> Kembali</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={() => onNext(d)}>Lanjut <RiArrowRightLine size={14} /></button>
        </div>
      </div>
    </>
  )
}

function Step5({ data, errors, onNext, onBack, onClose }: { data: Row; errors: Record<string, string>; onNext: (d: Row) => void; onBack: () => void; onClose: () => void }) {
  const [siteId, setSiteId] = useState(String(data.site_id ?? ""))
  const [d, setD] = useState({
    install_address: String(data.install_address ?? ""),
    install_city: String(data.install_city ?? ""),
    install_provinsi: String(data.install_provinsi ?? ""),
  })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiMapPin2Line size={16} /></div>
          Lokasi & Teknis
        </div>
        <div className="fab-grid-1">
          <FabField label="Site / POP" required error={errors.site_id}>
            <SitePicker initialSiteId={data.site_id ? String(data.site_id) : undefined} onChange={setSiteId} />
          </FabField>
        </div>
        <div className="fab-divider" />
        <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500, marginBottom: 14 }}>Alamat Instalasi (jika berbeda dari site)</div>
        <div className="fab-grid-2">
          <FabField label="Alamat Instalasi" error={errors.install_address} wide>
            <textarea className="textarea" style={{ fontSize: 13, minHeight: 72 }} value={d.install_address} onChange={e => set("install_address")(e.target.value)} placeholder="Alamat lengkap lokasi instalasi" />
          </FabField>
          <FabField label="Kota" error={errors.install_city}>
            <FabInput value={d.install_city} onChange={set("install_city")} placeholder="Kota" />
          </FabField>
          <FabField label="Provinsi" error={errors.install_provinsi}>
            <FabSelect value={d.install_provinsi} onChange={set("install_provinsi")} placeholder="Pilih Provinsi">
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </FabSelect>
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}><RiArrowLeftLine size={14} /> Kembali</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" onClick={() => onNext({ ...d, site_id: siteId })}>Lanjut <RiArrowRightLine size={14} /></button>
        </div>
      </div>
    </>
  )
}

function Step6({ data, errors, onSubmit, onBack, onClose, saving }: { data: Row; errors: Record<string, string>; onSubmit: (d: Row) => void; onBack: () => void; onClose: () => void; saving: boolean }) {
  const [d, setD] = useState({
    status: String(data.status ?? "Open"),
    request_date: String(data.request_date ?? ""),
    target_date: String(data.target_date ?? ""),
    rfs_date: String(data.rfs_date ?? ""),
    completion_date: String(data.completion_date ?? ""),
    pic: String(data.pic ?? ""),
    notes: String(data.notes ?? ""),
  })
  const set = (k: keyof typeof d) => (v: string) => setD(p => ({ ...p, [k]: v }))
  return (
    <>
      <div className="fab-body">
        <div className="fab-section-title">
          <div className="fab-section-icon"><RiCalendarCheckLine size={16} /></div>
          RFS & Dokumen
        </div>
        <div className="fab-grid-2">
          <FabField label="Status" required error={errors.status}>
            <FabSelect value={d.status} onChange={set("status")} placeholder="Pilih Status">
              {FAB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </FabSelect>
          </FabField>
          <FabField label="PIC / Penanggung Jawab" error={errors.pic}>
            <FabInput value={d.pic} onChange={set("pic")} placeholder="Nama PIC ISP" />
          </FabField>
          <FabField label="Tanggal Request" error={errors.request_date}>
            <input className="input" style={{ height: 40, fontSize: 13 }} type="date" value={d.request_date} onChange={e => set("request_date")(e.target.value)} />
          </FabField>
          <FabField label="Target Selesai" error={errors.target_date}>
            <input className="input" style={{ height: 40, fontSize: 13 }} type="date" value={d.target_date} onChange={e => set("target_date")(e.target.value)} />
          </FabField>
          <FabField label="Ready For Service (RFS)" error={errors.rfs_date}>
            <input className="input" style={{ height: 40, fontSize: 13 }} type="date" value={d.rfs_date} onChange={e => set("rfs_date")(e.target.value)} />
          </FabField>
          <FabField label="Tanggal Selesai" error={errors.completion_date}>
            <input className="input" style={{ height: 40, fontSize: 13 }} type="date" value={d.completion_date} onChange={e => set("completion_date")(e.target.value)} />
          </FabField>
          <FabField label="Catatan / Notes" error={errors.notes} wide>
            <textarea className="textarea" style={{ fontSize: 13 }} value={d.notes} onChange={e => set("notes")(e.target.value)} placeholder="Catatan tambahan..." />
          </FabField>
        </div>
      </div>
      <div className="fab-actions">
        <button type="button" className="btn btn-secondary" onClick={onBack}><RiArrowLeftLine size={14} /> Kembali</button>
        <div className="fab-actions-right">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => onSubmit(d)}>
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,.25)", borderTopColor: "#fff" }} />Menyimpan...</>
              : <><RiCheckLine size={14} /> Simpan FAB</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function FabWizard({ initial, onClose, onSaved }: { initial: Row | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(1)
  const [accumulated, setAccumulated] = useState<Row>(initial ?? {})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function validate(stepIndex: number, stepData: Row): boolean {
    const schema = FAB_STEP_SCHEMAS[stepIndex - 1]
    const result = schema.safeParse(stepData)
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const k = String(issue.path[0] ?? "")
        if (k && !errs[k]) errs[k] = issue.message
      }
      setFieldErrors(errs)
      return false
    }
    setFieldErrors({})
    return true
  }

  function advance(stepData: Row) {
    const clean = sanitize(stepData)
    if (!validate(step, clean)) return
    setAccumulated(prev => ({ ...prev, ...clean }))
    setStep(s => s + 1)
  }

  function sanitize(data: Row): Row {
    const DATE_KEYS = ["contract_date","pic_birth_date","pic_id_expiry","request_date","target_date","rfs_date","completion_date"]
    const out: Row = {}
    for (const [k, v] of Object.entries(data)) {
      if (DATE_KEYS.includes(k) && v === "") out[k] = undefined
      else out[k] = v
    }
    return out
  }

  async function submit(stepData: Row) {
    if (!validate(step, stepData)) return
    const allData = sanitize({ ...accumulated, ...stepData })
    setSaving(true)
    try {
      const method = initial ? "PATCH" : "POST"
      const url = initial ? `/api/fabs/${String(initial.id)}` : `/api/fabs`
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(allData) })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? "Data gagal disimpan.")
      showToast(initial ? "FAB diperbarui" : "FAB berhasil ditambahkan", "Data FAB tersimpan.", "success")
      onSaved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Data gagal disimpan."
      showToast("Gagal menyimpan FAB", msg, "error")
    } finally {
      setSaving(false)
    }
  }

  const stepProps = { data: accumulated, errors: fieldErrors }

  return (
    <div className="fab-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="fab-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="fab-modal-header">
          <span className="fab-modal-title">{initial ? "Edit FAB / Service Order" : "Tambah FAB / Service Order"}</span>
          <button className="fab-modal-close" onClick={onClose} aria-label="Tutup"><RiCloseLine size={16} /></button>
        </div>

        {/* Step tabs */}
        <div className="fab-steps">
          {STEPS.map(s => (
            <div key={s.id} className={`fab-step${step === s.id ? " active" : ""}${step > s.id ? " done" : ""}`}>
              <div className="fab-step-badge">
                {step > s.id ? <RiCheckLine size={10} /> : s.id}
              </div>
              {s.label}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 1 && <Step1 {...stepProps} onNext={advance} onClose={onClose} />}
        {step === 2 && <Step2 {...stepProps} onNext={advance} onBack={() => setStep(1)} onClose={onClose} />}
        {step === 3 && <Step3 {...stepProps} onNext={advance} onBack={() => setStep(2)} onClose={onClose} />}
        {step === 4 && <Step4 {...stepProps} onNext={advance} onBack={() => setStep(3)} onClose={onClose} />}
        {step === 5 && <Step5 {...stepProps} onNext={advance} onBack={() => setStep(4)} onClose={onClose} />}
        {step === 6 && <Step6 {...stepProps} onSubmit={submit} onBack={() => setStep(5)} onClose={onClose} saving={saving} />}
      </div>
    </div>
  )
}
