import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { z } from "zod"
import { auth } from "@/lib/better-auth"
import { requireAdmin } from "@/lib/auth"
import { profiles } from "@/lib/db/schema"
const schema = z.object({ email: z.string().email(), password: z.string().min(8), full_name: z.string().min(1).max(120), role: z.enum(["admin", "staff"]) })
export async function GET() { const { db } = await requireAdmin(); const data = await db.select({ id: profiles.id, fullName: profiles.fullName, email: profiles.email, role: profiles.role, isActive: profiles.isActive, createdAt: profiles.createdAt }).from(profiles).orderBy(desc(profiles.createdAt)); return NextResponse.json({ data }) }
export async function POST(request: Request) { const { db } = await requireAdmin(); const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ error: "Data user tidak valid" }, { status: 400 }); const result = await auth.api.signUpEmail({ body: { email: parsed.data.email.toLowerCase(), password: parsed.data.password, name: parsed.data.full_name } }); if (!result?.user) return NextResponse.json({ error: "Gagal membuat user" }, { status: 400 }); const [profile] = await db.insert(profiles).values({ id: result.user.id, fullName: parsed.data.full_name, email: parsed.data.email.toLowerCase(), role: parsed.data.role }).returning({ id: profiles.id }); return NextResponse.json({ data: profile }, { status: 201 }) }
