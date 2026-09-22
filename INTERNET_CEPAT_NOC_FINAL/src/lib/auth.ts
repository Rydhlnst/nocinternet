import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/better-auth"
import { getDb } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
export async function getCurrentUser() { const session = await auth.api.getSession({ headers: await headers() }); if (!session?.user) return null; const [profile] = await getDb().select().from(profiles).where(eq(profiles.id, session.user.id)).limit(1); return profile ?? null }
export async function requireUser() { const user = await getCurrentUser(); if (!user) redirect("/login"); return { user, db: getDb() } }
export async function requireAdmin() { const session = await requireUser(); if (session.user.role !== "admin") redirect("/dashboard"); return session }
