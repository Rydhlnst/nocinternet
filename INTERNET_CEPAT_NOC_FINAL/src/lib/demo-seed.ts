type DemoSeedContext = {
  siteIds: { jakarta: string; bandung: string; surabaya: string }
  cidIds: { jakarta: string; bandung: string; surabaya: string }
}

export const DEMO_SITE_CODES = {
  jakarta: "NOC-DEMO-JKT-01",
  bandung: "NOC-DEMO-BDG-01",
  surabaya: "NOC-DEMO-SBY-01",
} as const

export const DEMO_CID_NUMBERS = {
  jakarta: "CID-DEMO-JKT-001",
  bandung: "CID-DEMO-BDG-002",
  surabaya: "CID-DEMO-SBY-003",
} as const

export function buildDemoSeedData({ siteIds, cidIds }: DemoSeedContext) {
  return {
    sites: [
      { nama_site: "Demo POP Jakarta Selatan", site_id: DEMO_SITE_CODES.jakarta, provinsi: "DKI Jakarta", kota_kabupaten: "Jakarta Selatan", vlan: "210", kapasitas_bandwidth: "1 Gbps", media_akses: "Fiber Optic", pic_customer: "Rina Kurnia", no_telp_pic: "+62 811 1000 2001", pic_isp: "NOC Internet Cepat", tanggal_aktivasi: "2025-10-14", status_layanan: "Aktif", keterangan: "DATA DEMO — POP utama Jakarta Selatan." },
      { nama_site: "Demo Branch Bandung", site_id: DEMO_SITE_CODES.bandung, provinsi: "Jawa Barat", kota_kabupaten: "Kota Bandung", vlan: "220", kapasitas_bandwidth: "300 Mbps", media_akses: "Fiber Optic", pic_customer: "Dimas Pratama", no_telp_pic: "+62 811 1000 2002", pic_isp: "NOC Internet Cepat", tanggal_aktivasi: "2025-11-03", status_layanan: "Aktif", keterangan: "DATA DEMO — cabang Bandung." },
      { nama_site: "Demo Warehouse Surabaya", site_id: DEMO_SITE_CODES.surabaya, provinsi: "Jawa Timur", kota_kabupaten: "Kota Surabaya", vlan: "230", kapasitas_bandwidth: "200 Mbps", media_akses: "Wireless", pic_customer: "Sari Utami", no_telp_pic: "+62 811 1000 2003", pic_isp: "NOC Internet Cepat", tanggal_aktivasi: "2026-01-18", status_layanan: "Monitoring", keterangan: "DATA DEMO — warehouse Surabaya." },
    ],
    cids: [
      { site_id: siteIds.jakarta, cid_number: DEMO_CID_NUMBERS.jakarta, customer: "PT Nusantara Digital", service_type: "Dedicated Internet", bandwidth: "100 Mbps", vlan: "210", ip_address: "203.0.113.10", activation_date: "2025-10-14", status: "Aktif", pic: "Rina Kurnia", notes: "DATA DEMO — layanan produksi Jakarta." },
      { site_id: siteIds.bandung, cid_number: DEMO_CID_NUMBERS.bandung, customer: "PT Nusantara Digital", service_type: "IPVPN Link", bandwidth: "50 Mbps", vlan: "220", ip_address: "203.0.113.20", activation_date: "2025-11-03", status: "Provisioning", pic: "Dimas Pratama", notes: "DATA DEMO — provisioning cabang Bandung." },
      { site_id: siteIds.surabaya, cid_number: DEMO_CID_NUMBERS.surabaya, customer: "PT Logistik Nusantara", service_type: "Dedicated Internet", bandwidth: "200 Mbps", vlan: "230", ip_address: "203.0.113.30", activation_date: "2026-01-18", status: "Monitoring", pic: "Sari Utami", notes: "DATA DEMO — monitoring warehouse Surabaya." },
    ],
    fab: {
      fab_number: "FAB-DEMO-2026-001", workflow_status: "submitted", operational_status: "Open", contract_date: "2026-09-01", job_type: "Pasang Baru", previous_fab_number: null,
      company: { name: "PT Nusantara Digital", group: "Nusantara Group", business_type: "Technology", address: "Jl. Gatot Subroto No. 88", city: "Jakarta Selatan", province: "DKI Jakarta", postal_code: "12930", website: "https://nusantara-demo.test", email: "ops@nusantara-demo.test", npwp: "00.000.000.0-000.000", phone: "+62 21 5550 1000" },
      applicant: { name: "Rina Kurnia", department: "Operations", title: "Network Operations Manager", email: "rina.kurnia@nusantara-demo.test", phone_code: "+62", phone_number: "2155501001", phone_extension: "101", mobile_code: "+62", mobile_number: "81110002001", birth_place: "Jakarta", birth_date: "1991-04-12", id_type: "KTP", id_number: "3174011204910001", id_expiry: "2031-04-12" },
      financial_contact: { name: "Bagus Santoso", department: "Finance", title: "Finance Manager", email: "bagus.santoso@nusantara-demo.test", phone_code: "+62", phone_number: "2155501002", phone_extension: "102", mobile_code: "+62", mobile_number: "81110002002", birth_place: "Bandung", birth_date: "1988-07-20", id_type: "KTP", id_number: "3273012007880002", id_expiry: "2028-07-20" },
      services: [{ sequence: 1, site_id: siteIds.jakarta, requested_rfs_date: "2026-10-01", technical_contact: { name: "Andi Wijaya", department: "Infrastructure", title: "Network Engineer", email: "andi.wijaya@nusantara-demo.test", phone_code: "+62", phone_number: "2155501003", phone_extension: "103", mobile_code: "+62", mobile_number: "81110002003", birth_place: "Bekasi", birth_date: "1993-02-18", id_type: "KTP", id_number: "3275011802930003", id_expiry: "2033-02-18" }, products: [{ category: "internet", product: "Dedicated", package: "Business 100 Mbps", unit: "Mbps", quantity: 100, delivery_scope: "Domestic", uplink_required: true, space_m2: 0, rack_u: 0, power_kva: 0 }], endpoints: [{ role: "origin", country: "Indonesia", overseas_carrier: null, company_name: "PT Nusantara Digital", address: "Jl. Gatot Subroto No. 88, Jakarta Selatan", latitude: -6.2389, longitude: 106.8306, pic_name: "Rina Kurnia", phone: "+62 811 1000 2001", email: "rina.kurnia@nusantara-demo.test" }, { role: "destination", country: "Indonesia", overseas_carrier: null, company_name: "NOC Internet Cepat", address: "POP Jakarta Selatan", latitude: -6.2446, longitude: 106.823, pic_name: "Andi Wijaya", phone: "+62 811 1000 2003", email: "andi.wijaya@nusantara-demo.test" }] }],
      billing: { term_months: 12, billing_address: "PT Nusantara Digital, Jl. Gatot Subroto No. 88, Jakarta Selatan 12930", currency: "IDR", vat_rate: 11, charges: [{ type: "installation", service_amount: 2500000, port_amount: 0, local_access_amount: 1500000, on_demand_amount: 0, schedule_amount: 0, cpe_amount: 0, other_amount: 0, description: "Instalasi dan akses lokal" }, { type: "monthly", service_amount: 7500000, port_amount: 0, local_access_amount: 0, on_demand_amount: 0, schedule_amount: 0, cpe_amount: 0, other_amount: 0, description: "Layanan dedicated internet bulanan" }] },
      document_verifications: [{ document_type: "id_card", verified: true }, { document_type: "npwp", verified: true }], declaration_confirmed: true, notes: "DATA DEMO — FAB lengkap untuk pemeriksaan seluruh tab detail.",
    },
    upgrades: [
      { site_id: siteIds.jakarta, cid_id: cidIds.jakarta, current_bandwidth: "100 Mbps", requested_bandwidth: "200 Mbps", request_date: "2026-09-10", target_date: "2026-10-10", completion_date: null, status: "Requested", pic: "Rina Kurnia", notes: "DATA DEMO — upgrade kapasitas Jakarta." },
      { site_id: siteIds.bandung, cid_id: cidIds.bandung, current_bandwidth: "50 Mbps", requested_bandwidth: "100 Mbps", request_date: "2026-09-12", target_date: "2026-10-15", completion_date: null, status: "In Review", pic: "Dimas Pratama", notes: "DATA DEMO — upgrade kapasitas Bandung." },
    ],
    maintenance: [
      { site_id: siteIds.jakarta, cid_id: cidIds.jakarta, maintenance_type: "Preventive Maintenance", impact: "Tidak ada gangguan layanan", scheduled_at: "2026-10-05", started_at: null, completed_at: null, status: "Scheduled", pic_vendor: "Tim NOC Jakarta", notes: "DATA DEMO — pemeriksaan berkala perangkat POP." },
      { site_id: siteIds.surabaya, cid_id: cidIds.surabaya, maintenance_type: "Link Optimization", impact: "Potensi gangguan singkat maksimal 15 menit", scheduled_at: "2026-09-28", started_at: null, completed_at: null, status: "Planned", pic_vendor: "Tim NOC Surabaya", notes: "DATA DEMO — optimasi link warehouse." },
    ],
  }
}
