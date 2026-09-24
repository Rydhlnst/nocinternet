export type DashboardValueFormat = { prefix?: string; type?: string }

const EMPTY_VALUE = "—"

function formatDate(value: Date): string {
  if (Number.isNaN(value.getTime())) return EMPTY_VALUE
  const day = String(value.getUTCDate()).padStart(2, "0")
  const month = String(value.getUTCMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${value.getUTCFullYear()}`
}

function isPlainObject(value: object): boolean {
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function formatDashboardValue(value: unknown, format: DashboardValueFormat = {}): string {
  if (value === null || value === undefined) return EMPTY_VALUE
  if (value instanceof Date) return formatDate(value)
  if (Array.isArray(value)) return `${value.length} data`

  if (typeof value === "string") {
    if (value.trim() === "") return EMPTY_VALUE
    if (format.prefix) return `${format.prefix}${value.padStart(4, "0")}`
    if (format.type === "date" && value.includes("-")) {
      const [year, month, day] = value.split("-")
      return day && month && year ? `${day}/${month}/${year}` : value
    }
    return value
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return EMPTY_VALUE
    return format.prefix ? `${format.prefix}${String(value).padStart(4, "0")}` : String(value)
  }

  if (typeof value === "boolean") return value ? "Ya" : "Tidak"
  if (typeof value === "object") return isPlainObject(value) ? "Data tersedia" : EMPTY_VALUE
  return EMPTY_VALUE
}

export function CellValue({ value, format, className }: { value: unknown; format?: DashboardValueFormat; className?: string }) {
  return <span className={className}>{formatDashboardValue(value, format)}</span>
}