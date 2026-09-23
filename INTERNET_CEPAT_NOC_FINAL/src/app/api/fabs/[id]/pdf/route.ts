import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { getFabAggregate } from "@/lib/fab-server"
import { renderFabPdf } from "@/lib/fab-pdf"
import { auditLogs } from "@/lib/db/schema"

export const runtime = "nodejs"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { db, user } = await requireAdmin()
  const data = await getFabAggregate(db, id)
  if (!data) return NextResponse.json({ error: "FAB tidak ditemukan." }, { status: 404 })
  if (data.workflow_status !== "approved") return NextResponse.json({ error: "PDF resmi tersedia setelah FAB disetujui." }, { status: 409 })
  const pdf = await renderFabPdf(data)
  await db.insert(auditLogs).values({ userId: user.id, action: "download_fab_pdf", module: "fabs", recordId: id })
  return new NextResponse(pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${data.fab_number}.pdf"` } })
}
