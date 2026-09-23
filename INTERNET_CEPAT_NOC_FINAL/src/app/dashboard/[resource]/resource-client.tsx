"use client"

import React, { useEffect, useRef, useState } from "react"
import * as XLSX from "xlsx"
import {
  RiSearchLine, RiUploadLine, RiDownloadLine, RiAddLine,
  RiEditLine, RiDeleteBinLine, RiCloseLine,
  RiArrowLeftSLine, RiArrowRightSLine,
  RiRefreshLine,
} from "react-icons/ri"
import { useToast } from "@/components/toast"
import { schemas, siteSchema, validationMessage } from "@/lib/validation"
import { resourceSubtitles, resourceButtonLabel } from "@/lib/types"
import type { Resource, Field } from "@/lib/types"

type Row = Record<string, unknown>
type ApiError = { error?: string; details?: unknown }
type ApiData = ApiError & { data?: Row[]; total?: number; statusCounts?: Record<string, number>; filterCounts?: Record<string, Record<string, number>> }

const STATUS_FIELD: Record<Resource, string> = {
  sites: "status_layanan", cids: "status", fabs: "status", upgrades: "status", maintenance: "status",
}
const LIMITS = [10, 25, 50]
const FILTER_LABELS: Record<string, string> = {
  service_type: "Jenis Layanan",
  provinsi: "Provinsi",
  maintenance_type: "Jenis Maintenance",
  impact: "Impact",
}

const DEFAULT_STATUSES: Record<Resource, string[]> = {
  sites: ["Aktif", "Tidak Aktif"],
  cids: ["Aktif", "Tidak Aktif"],
  fabs: ["Open", "In Progress", "Completed", "Cancelled"],
  upgrades: ["Requested", "In Progress", "Completed", "On Hold", "Cancelled"],
  maintenance: ["Scheduled", "In Progress", "Completed", "Cancelled"],
}

function schemaFor(r: Resource) { return r === "sites" ? siteSchema : schemas[r] }
function fieldMessage(j: ApiError, fallback: string) { return j.details ? validationMessage(j.details) : (j.error ?? fallback) }

function formatCell(value: unknown, field: Field): string {
  if (value === null || value === undefined || value === "") return "—"
  if (field.prefix) return `${field.prefix}${String(value).padStart(4, "0")}`
  if (field.type === "date" && typeof value === "string" && value.includes("-")) {
    const [y, m, d] = value.split("-")
    return d && m && y ? `${d}/${m}/${y}` : value
  }
  return String(value)
}

function StatusBadge({ value }: { value: string }) {
  const slug = value.toLowerCase().replaceAll(" ", "-").replaceAll("_", "-")
  return (
    <span className={`status status-${slug}`}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
      {value}
    </span>
  )
}

function statusTone(status: string): string {
  const s = status.toLowerCase()
  if (s.includes("aktif") && !s.includes("tidak")) return "var(--success)"
  if (s.includes("active") && !s.includes("inactive")) return "var(--success)"
  if (s.includes("completed") || s === "done") return "var(--success)"
  if (s.includes("progress") || s.includes("schedul") || s.includes("planned")) return "var(--info)"
  if (s.includes("pending") || s.includes("requested") || s.includes("open")) return "var(--warning)"
  if (s.includes("hold")) return "var(--warning)"
  if (s.includes("cancel") || s.includes("inactive") || s.includes("tidak")) return "var(--danger)"
  return "var(--neutral)"
}

// Fields that should be rendered in monospace as technical identifiers.
const MONO_FIELDS = new Set(["site_id", "site_code", "cid_number", "ip_address", "fab_number", "vlan", "no"])

function pageRange(cur: number, total: number): (number | -1)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4) return [1, 2, 3, 4, 5, -1, total]
  if (cur >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total]
  return [1, -1, cur - 1, cur, cur + 1, -1, total]
}

type CustomFormProps = { initial: Row | null; onClose: () => void; onSaved: () => void }
export function ResourceClient({ resource, title, fields, customForm }: { resource: Resource; title: string; fields: Field[]; customForm?: (props: CustomFormProps) => React.ReactNode }) {
  const { showToast } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [filterCounts, setFilterCounts] = useState<Record<string, Record<string, number>>>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [q, setQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Row | null>(null)
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const tableCols = fields.filter(f => f.type !== "textarea")
  const statusField = STATUS_FIELD[resource]
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1
  const endRow = Math.min(page * limit, total)
  const kpiEntries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])
  const grandTotal = kpiEntries.reduce((s, [, n]) => s + n, 0)
  const subtitle = resourceSubtitles[resource]
  const hasAnyFilter = q || statusFilter || Object.values(extraFilters).some(Boolean)

  async function load(opts?: { p?: number; l?: number; q?: string; status?: string; extra?: Record<string, string> }) {
    const p = opts?.p ?? page
    const l = opts?.l ?? limit
    const search = opts?.q !== undefined ? opts.q : q
    const status = opts?.status !== undefined ? opts.status : statusFilter
    const extra = opts?.extra !== undefined ? opts.extra : extraFilters
    try {
      setLoading(true)
      const params = new URLSearchParams({ q: search, page: String(p), limit: String(l), status })
      Object.entries(extra).forEach(([k, v]) => { if (v) params.set(k, v) })
      const res = await fetch(`/api/${resource}?${params.toString()}`)
      const json = await res.json() as ApiData
      if (!res.ok) throw new Error(fieldMessage(json, "Data gagal dimuat."))
      setError("")
      setRows(json.data ?? [])
      setTotal(json.total ?? 0)
      setStatusCounts(json.statusCounts ?? {})
      setFilterCounts(json.filterCounts ?? {})
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Data gagal dimuat."
      setError(msg)
      showToast("Gagal memuat data", msg, "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function handleSearch(value: string) {
    setQ(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => { setPage(1); void load({ q: value, p: 1 }) }, 300)
  }

  function handleStatus(value: string) { setStatusFilter(value); setPage(1); void load({ status: value, p: 1 }) }
  function handleExtraFilter(key: string, value: string) {
    const next = { ...extraFilters, [key]: value }
    setExtraFilters(next); setPage(1); void load({ extra: next, p: 1 })
  }
  function handlePage(p: number) { setPage(p); void load({ p }) }
  function handleLimit(l: number) { setLimit(l); setPage(1); void load({ l, p: 1 }) }
  function reset() { setQ(""); setStatusFilter(""); setExtraFilters({}); setPage(1); void load({ q: "", status: "", extra: {}, p: 1 }) }

  function exportRows() {
    const sheet = XLSX.utils.json_to_sheet(rows)
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, resource)
    XLSX.writeFile(book, `${resource}-export.xlsx`)
    showToast("Export berhasil", `${rows.length} baris ${title.toLowerCase()} diunduh.`, "success")
  }

  async function importFile(file: File) {
    try {
      const wb = XLSX.read(await file.arrayBuffer())
      const ws = wb.Sheets[wb.SheetNames[0]]
      if (!ws) throw new Error("Workbook tidak memiliki sheet yang bisa dibaca.")
      const data = XLSX.utils.sheet_to_json<Row>(ws)
      if (!data.length) throw new Error("File Excel kosong. Isi minimal satu baris data.")
      let failures = 0; let firstError = ""
      for (const [i, row] of data.entries()) {
        const res = await fetch(`/api/${resource}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) })
        if (!res.ok) { failures++; if (!firstError) firstError = `Baris ${i + 2}: ${fieldMessage(await res.json() as ApiError, "data tidak valid")}` }
      }
      if (failures) showToast("Import perlu diperbaiki", `${failures} baris gagal. ${firstError}`, "error")
      else showToast("Import berhasil", `${data.length} baris berhasil ditambahkan.`, "success")
      void load()
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "File tidak dapat diproses."
      showToast("Import gagal", `${msg} Gunakan .xlsx, .xls, atau .csv dengan kolom sesuai form.`, "error")
    }
  }

  async function archive(row: Row) {
    if (!window.confirm("Arsipkan data ini? Data tidak akan tampil di daftar aktif.")) return
    try {
      setArchivingId(String(row.id))
      const res = await fetch(`/api/${resource}/${row.id}`, { method: "DELETE" })
      const json = await res.json() as ApiError
      if (!res.ok) throw new Error(fieldMessage(json, "Data gagal diarsipkan."))
      showToast("Data diarsipkan", "Record berhasil dipindahkan dari daftar aktif.", "success")
      void load()
    } catch (cause) {
      showToast("Gagal mengarsipkan", cause instanceof Error ? cause.message : "Coba lagi.", "error")
    } finally {
      setArchivingId(null)
    }
  }

  // Always show the module's default status set; overlay real backend counts.
  // Extra statuses returned by the backend (outside defaults) are appended.
  const defaultStatuses = DEFAULT_STATUSES[resource]
  const extraStatuses = Object.keys(statusCounts).filter(s => !defaultStatuses.includes(s))
  const kpiList: [string, number][] = [
    ...defaultStatuses.map(s => [s, statusCounts[s] ?? 0] as [string, number]),
    ...extraStatuses.map(s => [s, statusCounts[s]] as [string, number]),
  ]

  return (
    <>
      {/* 1. Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <span className="eyebrow">Operational Register</span>
          <h1 className="page-title">{title}</h1>
          <p className="page-sub">{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <label className="btn btn-secondary">
            <RiUploadLine size={14} /> Import Excel
            <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) void importFile(f); e.currentTarget.value = "" }} />
          </label>
          <button className="btn btn-secondary" onClick={exportRows}><RiDownloadLine size={14} /> Export</button>
          <button className="btn btn-primary" onClick={() => setAdding(true)}>
            <RiAddLine size={14} /> Tambah {resourceButtonLabel[resource]}
          </button>
        </div>
      </div>

      {/* 2. Compact KPI strip — click to filter by status */}
      <div className="kpi-strip">
        <button
          type="button"
          className={`kpi-tile total${statusFilter === "" ? " active" : ""}`}
          onClick={() => handleStatus("")}
          aria-pressed={statusFilter === ""}
        >
          <span className="kpi-tile-label">Total {resourceButtonLabel[resource]}</span>
          <span className="kpi-tile-value">
            {loading && grandTotal === 0 ? <span className="skeleton" style={{ width: 40, height: 22 }} /> : grandTotal}
          </span>
          <span className="kpi-tile-sub">Seluruh data aktif</span>
        </button>
        {kpiList.map(([status, cnt]) => {
          const active = statusFilter === status
          const tone = statusTone(status)
          return (
            <button
              key={status}
              type="button"
              className={`kpi-tile${active ? " active" : ""}`}
              onClick={() => handleStatus(active ? "" : status)}
              aria-pressed={active}
              style={active ? { borderLeftColor: tone } : undefined}
            >
              <span className="kpi-tile-label">
                <span className="kpi-tile-dot" style={{ background: tone }} />
                {status}
              </span>
              <span className="kpi-tile-value">
                {loading && cnt === 0 ? <span className="skeleton" style={{ width: 30, height: 22 }} /> : cnt}
              </span>
              <span className="kpi-tile-sub">
                {grandTotal > 0 ? `${((cnt / grandTotal) * 100).toFixed(1)}% of total` : "—"}
              </span>
            </button>
          )
        })}
      </div>

      {/* 3. Unified toolbar: search + filters + reset */}
      <div className="toolbar-unified">
        <div className="toolbar-search">
          <RiSearchLine size={14} />
          <input
            className="input"
            placeholder={`Cari ${title.toLowerCase()}...`}
            value={q}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <select
          className="input toolbar-select"
          value={statusFilter}
          onChange={e => handleStatus(e.target.value)}
          aria-label="Status filter"
        >
          <option value="">Semua Status</option>
          {Object.keys(statusCounts).sort().map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {Object.entries(filterCounts).map(([key, counts]) => (
          <select
            key={key}
            className="input toolbar-select"
            value={extraFilters[key] ?? ""}
            onChange={e => handleExtraFilter(key, e.target.value)}
            aria-label={FILTER_LABELS[key] ?? key}
          >
            <option value="">{FILTER_LABELS[key] ?? key}</option>
            {Object.keys(counts).sort().map(v => <option key={v} value={v}>{v} ({counts[v]})</option>)}
          </select>
        ))}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => void load()}
          disabled={loading}
          title="Refresh"
          aria-label="Refresh data"
        >
          <RiRefreshLine size={13} />
        </button>
        {hasAnyFilter && (
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            <RiCloseLine size={13} /> Reset
          </button>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* 4. Enterprise data grid */}
      <div className="panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>Daftar {title}</span>
          {total > 0 && !loading && (
            <span className="pg-info">{startRow}–{endRow} dari {total}</span>
          )}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "40px 20px" }}>
              <span className="spinner" style={{ width: 22, height: 22 }} />
              <span>Memuat data...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty">
              {hasAnyFilter ? (
                <>
                  <div className="empty-title">Tidak ada data yang sesuai filter</div>
                  <div>Ubah kriteria pencarian atau reset filter untuk melihat semua data.</div>
                  <div className="empty-actions">
                    <button className="btn btn-secondary btn-sm" onClick={reset}>
                      <RiCloseLine size={13} /> Reset Filter
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="empty-title">Belum ada data</div>
                  <div>Tambahkan record pertama untuk memulai.</div>
                  <div className="empty-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>
                      <RiAddLine size={13} /> Tambah {resourceButtonLabel[resource]}
                    </button>
                    <label className="btn btn-secondary btn-sm">
                      <RiUploadLine size={13} /> Import Excel
                      <input hidden type="file" accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) void importFile(f); e.currentTarget.value = "" }} />
                    </label>
                  </div>
                </>
              )}
            </div>
          ) : (
            <table className="table-enterprise">
              <thead>
                <tr>
                  <th style={{ width: 44, textAlign: "center" }}>#</th>
                  {tableCols.map(f => <th key={f.key}>{f.label}</th>)}
                  <th style={{ width: 88 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={String(row.id)}>
                    <td style={{ textAlign: "center", color: "var(--muted)", fontSize: 11 }}>{startRow + i}</td>
                    {tableCols.map(f => (
                      <td key={f.key}>
                        {f.key === statusField
                          ? <StatusBadge value={String(row[f.key] ?? "—")} />
                          : MONO_FIELDS.has(f.key)
                            ? <span className="mono">{formatCell(row[f.key], f)}</span>
                            : formatCell(row[f.key], f)}
                      </td>
                    ))}
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-secondary btn-icon" title="Edit" onClick={() => setEditing(row)}>
                          <RiEditLine size={13} />
                        </button>
                        <button className="btn btn-danger btn-icon" title="Arsipkan" disabled={archivingId === String(row.id)} onClick={() => void archive(row)}>
                          {archivingId === String(row.id)
                            ? <span className="spinner" style={{ width: 12, height: 12, borderColor: "rgba(220,38,38,.2)", borderTopColor: "var(--danger)" }} />
                            : <RiDeleteBinLine size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > 0 && (
          <div className="pg-bar">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pg-info">Tampilkan</span>
              <select
                className="input"
                style={{ height: 30, width: "auto", minWidth: 0, fontSize: 12, padding: "0 24px 0 8px" }}
                value={limit}
                onChange={e => handleLimit(Number(e.target.value))}
              >
                {LIMITS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="pg-info">per halaman</span>
            </div>
            <div className="pg-controls">
              <button className="pg-btn" disabled={page <= 1} onClick={() => handlePage(page - 1)}>
                <RiArrowLeftSLine size={15} />
              </button>
              {pageRange(page, totalPages).map((p, i) =>
                p === -1
                  ? <span key={`e${i}`} style={{ padding: "0 2px", color: "var(--muted)", fontSize: 13 }}>…</span>
                  : <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => handlePage(p)}>{p}</button>
              )}
              <button className="pg-btn" disabled={page >= totalPages} onClick={() => handlePage(page + 1)}>
                <RiArrowRightSLine size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {(adding || editing) && (
        customForm
          ? customForm({ initial: editing, onClose: () => { setAdding(false); setEditing(null) }, onSaved: () => { setAdding(false); setEditing(null); void load() } })
          : <RecordForm resource={resource} fields={fields} initial={editing} onClose={() => { setAdding(false); setEditing(null) }} onSaved={() => { setAdding(false); setEditing(null); void load() }} />
      )}
    </>
  )
}

// ─── CID picker ────────────────────────────────────────────────────────────────

type CidOption = { id: string; cid_number: string; customer: string | null; bandwidth: string | null; site_id: string; site_code: string | null; site_name: string | null }

function CidPicker({ initialCidId, onSelect }: { initialCidId?: string; onSelect: (cid: CidOption | null) => void }) {
  const [query, setQuery] = useState(""); const [options, setOptions] = useState<CidOption[]>([]); const [selected, setSelected] = useState<CidOption | null>(null); const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!initialCidId) return
    fetch(`/api/cids/${initialCidId}`).then(r => r.json()).then((json: { data?: CidOption }) => {
      if (json.data) { setSelected(json.data); onSelect(json.data) }
    }).catch(() => {})
  }, [initialCidId])
  async function search(value: string) { setQuery(value); const res = await fetch(`/api/cids?q=${encodeURIComponent(value)}&limit=20`); const json = await res.json() as { data?: CidOption[] }; setOptions(json.data ?? []); setOpen(true) }
  function pick(cid: CidOption) { setSelected(cid); onSelect(cid); setQuery(""); setOpen(false); setOptions([]) }
  function clear() { setSelected(null); onSelect(null); setQuery(""); setOptions([]); setOpen(false) }
  return (
    <label className="field wide">
      CID Number
      <input type="hidden" name="cid_id" value={selected?.id ?? ""} />
      {selected
        ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="input" style={{ flex: 1, display: "flex", gap: 10, alignItems: "center" }}>
              <strong>{selected.cid_number}</strong>
              {selected.customer && <span style={{ color: "var(--muted)" }}>— {selected.customer}</span>}
              {selected.site_name && <span style={{ color: "var(--muted)", fontSize: 11 }}>({selected.site_name})</span>}
            </div>
            <button type="button" className="btn btn-secondary" onClick={clear}>Ganti</button>
          </div>
        : <div style={{ position: "relative" }}>
            <input className="input" placeholder="Ketik CID number atau nama customer..." value={query} autoComplete="off"
              onChange={e => void search(e.target.value)}
              onFocus={() => { if (options.length === 0) void search(query) }}
              onBlur={() => setTimeout(() => setOpen(false), 150)} />
            {open && options.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 6, zIndex: 20, maxHeight: 220, overflow: "auto", boxShadow: "0 4px 12px #0002" }}>
                {options.map(cid => (
                  <button key={cid.id} type="button" onMouseDown={() => pick(cid)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderBottom: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13 }}>
                    <strong>{cid.cid_number}</strong>
                    {cid.customer && <span style={{ color: "var(--muted)", marginLeft: 6 }}>{cid.customer}</span>}
                    {cid.site_name && <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: 6 }}>· {cid.site_name}</span>}
                    {cid.bandwidth && <span style={{ color: "var(--accent)", fontSize: 11, marginLeft: 6 }}>{cid.bandwidth}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
      }
    </label>
  )
}

// ─── Site picker ───────────────────────────────────────────────────────────────

type SiteOption = { id: string; site_id: string; nama_site: string }

function SitePicker({ initialSiteId }: { initialSiteId?: string }) {
  const [query, setQuery] = useState(""); const [options, setOptions] = useState<SiteOption[]>([]); const [selected, setSelected] = useState<SiteOption | null>(null); const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!initialSiteId) return
    fetch(`/api/sites/${initialSiteId}`).then(r => r.json()).then((json: { data?: SiteOption }) => {
      if (json.data) setSelected(json.data)
    }).catch(() => {})
  }, [initialSiteId])
  async function search(value: string) { setQuery(value); const res = await fetch(`/api/sites?q=${encodeURIComponent(value)}`); const json = await res.json() as { data?: SiteOption[] }; setOptions(json.data ?? []); setOpen(true) }
  function pick(site: SiteOption) { setSelected(site); setQuery(""); setOpen(false); setOptions([]) }
  function clear() { setSelected(null); setQuery(""); setOptions([]); setOpen(false) }
  return (
    <label className="field wide">
      Site
      <input type="hidden" name="site_id" value={selected?.id ?? ""} />
      {selected
        ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}><div className="input" style={{ flex: 1 }}><strong>{selected.site_id}</strong> — {selected.nama_site}</div><button type="button" className="btn btn-secondary" onClick={clear}>Ganti</button></div>
        : <div style={{ position: "relative" }}>
            <input className="input" placeholder="Ketik nama site atau Site ID..." value={query} autoComplete="off"
              onChange={e => void search(e.target.value)}
              onFocus={() => { if (options.length === 0) void search(query) }}
              onBlur={() => setTimeout(() => setOpen(false), 150)} />
            {open && options.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "1px solid var(--line)", borderRadius: 6, zIndex: 20, maxHeight: 220, overflow: "auto", boxShadow: "0 4px 12px #0002" }}>
                {options.map(site => (
                  <button key={site.id} type="button" onMouseDown={() => pick(site)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", border: "none", borderBottom: "1px solid var(--line)", background: "transparent", cursor: "pointer", fontSize: 13 }}>
                    <strong>{site.site_id}</strong><span style={{ color: "var(--muted)", marginLeft: 6 }}>{site.nama_site}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
      }
    </label>
  )
}

// ─── Record form ───────────────────────────────────────────────────────────────

function RecordForm({ resource, fields, initial, onClose, onSaved }: { resource: Resource; fields: Field[]; initial: Row | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [cidPicked, setCidPicked] = useState<CidOption | null>(null)
  const [bwValue, setBwValue] = useState(String(initial?.current_bandwidth ?? ""))
  const [siteIdFromCid, setSiteIdFromCid] = useState("")

  const formFields = fields.filter(f => !f.virtual)

  function handleCidSelect(cid: CidOption | null) {
    setCidPicked(cid)
    if (cid) {
      setBwValue(cid.bandwidth ?? "")
      setSiteIdFromCid(cid.site_id)
    } else {
      setSiteIdFromCid("")
    }
  }

  async function submit(formData: FormData) {
    const body = Object.fromEntries([...formData.entries()].map(([key, value]) => [key, value === "" ? undefined : value]))
    const parsed = schemaFor(resource).safeParse(body)
    if (!parsed.success) { const message = parsed.error.issues[0]?.message ?? "Periksa format data."; setError(message); showToast("Data belum sesuai", message, "error"); return }
    try {
      setSaving(true)
      const method = initial ? "PATCH" : "POST"
      const res = await fetch(initial ? `/api/${resource}/${initial.id}` : `/api/${resource}`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) })
      const json = await res.json() as ApiError
      if (!res.ok) throw new Error(fieldMessage(json, "Data tidak dapat disimpan."))
      showToast(initial ? "Data diperbarui" : "Data berhasil ditambahkan", "Perubahan tersimpan.", "success")
      onSaved()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Data tidak dapat disimpan."
      setError(message)
      showToast("Gagal menyimpan data", `${message} Saran: periksa format tanggal YYYY-MM-DD dan field wajib.`, "error")
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#1B232B88", display: "grid", placeItems: "center", padding: 20, zIndex: 5 }}>
      <div className="panel" style={{ width: "min(720px, 100%)", maxHeight: "90vh", overflow: "auto" }}>
        <div className="panel-head">
          <h2>{initial ? "Edit data" : "Tambah data"}</h2>
          <button className="btn btn-secondary" onClick={onClose}>Tutup</button>
        </div>
        <form className="panel-body form-grid" action={submit}>
          {(resource === "upgrades" || resource === "maintenance")
            ? <>
                <CidPicker initialCidId={initial?.cid_id ? String(initial.cid_id) : undefined} onSelect={handleCidSelect} />
                {siteIdFromCid && <input type="hidden" name="site_id" value={siteIdFromCid} />}
                {!siteIdFromCid && <SitePicker initialSiteId={initial ? String(initial.site_id ?? "") : undefined} />}
              </>
            : resource !== "sites" && <SitePicker initialSiteId={initial ? String(initial.site_id) : undefined} />
          }
          {formFields.map(field => {
            if (field.key === "current_bandwidth" && resource === "upgrades") {
              return (
                <label className="field" key={field.key}>
                  {field.label}
                  <input
                    className="input"
                    name="current_bandwidth"
                    type="text"
                    value={bwValue}
                    onChange={e => setBwValue(e.target.value)}
                    placeholder="Contoh: 100 Mbps"
                    required={field.required}
                    style={cidPicked ? { background: "var(--paper)" } : undefined}
                  />
                  {cidPicked && <span style={{ fontSize: 11, color: "var(--muted)" }}>Diisi otomatis dari CID · bisa diubah manual</span>}
                </label>
              )
            }
            return (
              <label className={`field ${field.type === "textarea" ? "wide" : ""}`} key={field.key}>
                {field.label}
                {field.type === "textarea"
                  ? <textarea className="textarea" name={field.key} defaultValue={String(initial?.[field.key] ?? "")} required={field.required} />
                  : <input className="input" name={field.key} type={field.type ?? "text"} defaultValue={String(initial?.[field.key] ?? "")} required={field.required} />}
              </label>
            )
          })}
          {error && <div className="error wide">{error}</div>}
          <div className="wide">
            <button className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: "rgba(255,255,255,.25)", borderTopColor: "#fff" }} />Menyimpan...</> : "Simpan data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
