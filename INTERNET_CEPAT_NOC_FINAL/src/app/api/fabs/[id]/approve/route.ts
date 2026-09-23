import { NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { requireAdmin } from "@/lib/admin-auth"
import { auditLogs, fabs } from "@/lib/db/schema"
import { describeApiError } from "@/lib/api-error"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, user } = await requireAdmin()
    const [fab] = await db.update(fabs).set({ workflowStatus: "approved", approvedAt: new Date(), approvedBy: user.id }).where(and(eq(fabs.id, id), eq(fabs.workflowStatus, "submitted"), isNull(fabs.archivedAt))).returning({ id: fabs.id })
    if (!fab) return NextResponse.json({ error: "Hanya FAB berstatus submitted yang dapat disetujui." }, { status: 409 })
    await db.insert(auditLogs).values({ userId: user.id, action: "approve_fab", module: "fabs", recordId: id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal disetujui.") }, { status: 400 })
  }
}
