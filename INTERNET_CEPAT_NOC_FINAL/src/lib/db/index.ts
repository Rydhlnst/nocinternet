import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import * as schema from "./schema"

function createDb(url: string) {
  return drizzle({ client: new Pool({ connectionString: url, max: 1 }), schema })
}

const globalForDb = globalThis as typeof globalThis & { nocDb?: ReturnType<typeof createDb>; nocDatabaseUrl?: string }

export function getDb() {
  const url = process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost/placeholder"
  if (!globalForDb.nocDb || globalForDb.nocDatabaseUrl !== url) {
    globalForDb.nocDb = createDb(url)
    globalForDb.nocDatabaseUrl = url
  }
  return globalForDb.nocDb
}