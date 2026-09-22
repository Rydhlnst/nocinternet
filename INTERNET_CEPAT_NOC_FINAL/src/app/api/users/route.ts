import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin-auth"
import { auth } from "@/lib/better-auth"
import { getDb } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { userSchema } from "@/lib/validation"

export async function GET() { const { db } = await requireAdmin(); const rows = await db.select().from(profiles); return NextResponse.json({ data: rows }) }
export async function POST(request: Request) {
  const { db } = await requireAdmin()
  const parsed = userSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: "Data user belum sesuai", details: parsed.error.flatten() }, { status: 400 })
  try {
    const result = await auth.api.signUpEmail({ body: { email: parsed.data.email.toLowerCase(), password: parsed.data.password, name: parsed.data.full_name } })
    if (!result?.user) return NextResponse.json({ error: "Akun user gagal dibuat. Periksa kembali email dan password." }, { status: 400 })
    const [profile] = await db.insert(profiles).values({ id: result.user.id, fullName: parsed.data.full_name, email: parsed.data.email.toLowerCase(), role: parsed.data.role }).returning({ id: profiles.id })
    return NextResponse.json({ data: profile }, { status: 201 })
  } catch (cause) {
    const message = cause instanceof z.ZodError ? cause.issues[0]?.message : "Email mungkin sudah digunakan atau data tidak dapat disimpan."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
