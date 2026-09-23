import { NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { requireAdmin } from "@/lib/admin-auth"
import { auditLogs, fabs } from "@/lib/db/schema"
import { describeApiError } from "@/lib/api-error"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, user } = await requireAdmin()
    const [fab] = await db.update(fabs).set({ workflowStatus: "draft", submittedAt: null, approvedAt: null, approvedBy: null }).where(and(eq(fabs.id, id), isNull(fabs.archivedAt))).returning({ id: fabs.id })
    if (!fab) return NextResponse.json({ error: "FAB tidak ditemukan." }, { status: 404 })
    await db.insert(auditLogs).values({ userId: user.id, action: "return_fab_to_draft", module: "fabs", recordId: id })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal dikembalikan ke draft.") }, { status: 400 })
  }
}
