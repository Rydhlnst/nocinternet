import { NextRequest, NextResponse } from "next/server"
import { and, eq, isNull } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { describeApiError } from "@/lib/api-error"
import { fabs } from "@/lib/db/schema"
import { fabDraftSchema } from "@/lib/fab-validation"
import { canManageFab, getFabAggregate, redactFabForStaff, saveFabGraph } from "@/lib/fab-server"

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, user } = await requireUser()
    const data = await getFabAggregate(db, id)
    if (!data) return NextResponse.json({ error: "FAB tidak ditemukan." }, { status: 404 })
    if (!canManageFab(user, { createdBy: data.created_by })) return NextResponse.json({ error: "Anda tidak memiliki akses ke detail FAB ini." }, { status: 403 })
    return NextResponse.json({ data: user.role === "admin" ? data : redactFabForStaff(data) })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "Detail FAB gagal dimuat.") }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { db, user } = await requireUser()
    const [existing] = await db.select({ createdBy: fabs.createdBy, workflowStatus: fabs.workflowStatus }).from(fabs).where(and(eq(fabs.id, id), isNull(fabs.archivedAt))).limit(1)
    if (!existing) return NextResponse.json({ error: "FAB tidak ditemukan." }, { status: 404 })
    if (!canManageFab(user, existing)) return NextResponse.json({ error: "Hanya pembuat draft atau admin yang dapat mengubah FAB." }, { status: 403 })
    if (existing.workflowStatus === "approved") return NextResponse.json({ error: "FAB yang disetujui harus dikembalikan ke draft sebelum diubah." }, { status: 409 })
    const parsed = fabDraftSchema.safeParse(await request.json())
    if (!parsed.success || parsed.data.workflow_status !== "draft") return NextResponse.json({ error: "Perubahan harus disimpan sebagai draft.", details: parsed.success ? undefined : parsed.error.flatten() }, { status: 400 })
    const data = await saveFabGraph(db, user, parsed.data, id)
    return NextResponse.json({ data: { id: data.id } })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal diperbarui.") }, { status: 400 })
  }
}
