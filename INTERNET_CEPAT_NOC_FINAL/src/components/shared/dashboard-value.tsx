type DashboardValueFormat = { prefix?: string; type?: string }

export function formatDashboardValue(value: unknown, format: DashboardValueFormat = {}): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) return value.length === 0 ? "—" : `${value.length} data`
  if (typeof value === "object") return "Data tersedia"
  if (format.prefix) return `${format.prefix}${String(value).padStart(4, "0")}`
  if (format.type === "date" && typeof value === "string" && value.includes("-")) {
    const [year, month, day] = value.split("-")
    return day && month && year ? `${day}/${month}/${year}` : value
  }
  return String(value)
}

export function DashboardValue({ value, format, mono = false }: { value: unknown; format?: DashboardValueFormat; mono?: boolean }) {
  return <span className={mono ? "mono" : undefined}>{formatDashboardValue(value, format)}</span>
}
