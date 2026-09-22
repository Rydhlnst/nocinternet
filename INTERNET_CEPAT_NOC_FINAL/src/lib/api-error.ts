export function describeApiError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  if (message.includes("unique") || message.includes("duplicate")) return "Data duplikat. Gunakan identifier yang belum terdaftar."
  if (message.includes("foreign key") || message.includes("violates")) return "Relasi data tidak valid. Pilih site yang sudah terdaftar dan pastikan record belum diarsipkan."
  if (message.includes("not-null") || message.includes("null value")) return "Ada field wajib yang belum diisi. Lengkapi semua field bertanda wajib."
  return fallback
}
