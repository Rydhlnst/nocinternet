const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export function formatFabDetailDate(value: string | null | undefined): string {
  if (!value) return "—"

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00Z`
    : value
  const date = new Date(normalized)

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date)
}