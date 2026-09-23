import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { describeApiError } from "@/lib/api-error"
import { fabDraftSchema } from "@/lib/fab-validation"
import { listFabSummaries, saveFabGraph } from "@/lib/fab-server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    return NextResponse.json({ data: await listFabSummaries(getDb()) })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal dimuat.") }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const db = getDb()
    const parsed = fabDraftSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: "Data draft belum sesuai", details: parsed.error.flatten() }, { status: 400 })
    if (parsed.data.workflow_status !== "draft") return NextResponse.json({ error: "FAB baru harus disimpan sebagai draft." }, { status: 400 })
    const data = await saveFabGraph(db, user, parsed.data)
    return NextResponse.json({ data: { id: data.id } }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: describeApiError(error, "FAB gagal disimpan.") }, { status: 400 })
  }
}
