import { loadEnvConfig } from "@next/env"

async function main() {
  loadEnvConfig(process.cwd())
  const { hashPassword, verifyPassword } = await import("better-auth/crypto")
  const { and, eq } = await import("drizzle-orm")
  const { auth } = await import("@/lib/better-auth")
  const { getDb } = await import("@/lib/db")
  const { authAccount, authUser, profiles } = await import("@/lib/db/schema")
  const email = "nocinternetcepat@gmail.com"
  const password = process.env.NOC_ADMIN_PASSWORD
  if (!password) throw new Error("NOC_ADMIN_PASSWORD is required")

  const db = getDb()
  const existing = await db.select().from(authUser).where(eq(authUser.email, email)).limit(1)
  let userId = existing[0]?.id

  if (!userId) {
    const result = await auth.api.signUpEmail({ body: { email, password, name: "NOC Administrator" } })
    if (!result.user) throw new Error("Better Auth did not create the admin user")
    userId = result.user.id
  } else {
    const passwordHash = await hashPassword(password)
    const account = await db.select({ id: authAccount.id }).from(authAccount).where(and(eq(authAccount.userId, userId), eq(authAccount.providerId, "credential"))).limit(1)
    if (!account[0]) throw new Error("Credential account is missing for the existing admin user")
    await db.update(authAccount).set({ password: passwordHash, updatedAt: new Date() }).where(eq(authAccount.id, account[0].id))
  }

  await db.update(profiles).set({ fullName: "NOC Administrator", email, role: "admin", isActive: true }).where(eq(profiles.id, userId))
  const credential = await db.select({ password: authAccount.password }).from(authAccount).where(and(eq(authAccount.userId, userId), eq(authAccount.providerId, "credential"))).limit(1)
  if (!credential[0]?.password || !(await verifyPassword({ hash: credential[0].password, password }))) throw new Error("Seeded password verification failed")
  console.log(`Admin seed completed and verified for ${email}`)
}

main().catch(error => { console.error("Admin seed failed:", error instanceof Error ? error.message : error); process.exitCode = 1 })
