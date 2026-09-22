import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { getDb } from "@/lib/db"
import { authAccount, authSession, authUser, authVerification, profiles } from "@/lib/db/schema"
export const auth = betterAuth({ database: drizzleAdapter(getDb(), { provider: "pg", schema: { user: authUser, session: authSession, account: authAccount, verification: authVerification } }), emailAndPassword: { enabled: true }, secret: process.env.BETTER_AUTH_SECRET, baseURL: process.env.BETTER_AUTH_URL, databaseHooks: { user: { create: { after: async (user) => { await getDb().insert(profiles).values({ id: user.id, fullName: user.name, email: user.email }) } } } } })
