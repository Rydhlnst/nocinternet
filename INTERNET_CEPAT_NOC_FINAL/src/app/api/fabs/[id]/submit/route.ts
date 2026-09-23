import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { describeApiError } from "@/lib/api-error"
import { fabs } from "@/lib/db/schema"
import { fabSubmissionSchema } from "@/lib/fab-validation"
import { canManageFab, saveFabGraph } from "@/lib/fab-server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, user } = await requireUser()
    const [existing] = await db.select({ createdBy: fabs.createdBy, workflowStatus: fabs.workflowStatus }).from(fabs).where(and(eq(fabs.id, id), isNull(fabs.archivedAt))).limit(1)
    if (!existing) return NextResponse.json({ error: "FAB tidak ditemukan." }, { status: 404 })
    if (!canManageFab(user, existing) || existing.workflowStatus !== "draft") return NextResponse.json({ error: "Hanya draft milik Anda yang dapat disubmit." }, { status: 403 })
    const parsed = fabSubmissionSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Lengkapi seluruh data sebelum submit.", details: parsed.error.flatten() }, { status: 400 })
    await saveFabGraph(db, user, parsed.data, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal disubmit.") }, { status: 400 })
  }
}
