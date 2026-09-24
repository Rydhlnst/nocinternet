import { describe, expect, it, beforeAll } from "vitest"
import { loadEnvConfig } from "@next/env"
import { getDb } from "@/lib/db"
import { sql } from "drizzle-orm"

// Load .env.local if available (for local runs)
if (!process.env.DATABASE_URL) {
  try {
    const { config } = await import("dotenv")
    config({ path: ".env.local" })
  } catch { /* dotenv not available; rely on environment */ }
}

const hasDb = Boolean(process.env.DATABASE_URL)

describe("Database connectivity", () => {
  beforeAll(() => {
    if (!hasDb) console.warn("DATABASE_URL not set — skipping DB connectivity tests")
  })

  it("OK DB-01 connects to the database and executes a simple query", async () => {
    if (!hasDb) return
    const db = getDb()
    const result = await db.execute(sql`SELECT 1 AS one`)
    expect(result).toBeTruthy()
  }, 15000)

  it("OK DB-02 can count rows in the sites table", async () => {
    if (!hasDb) return
    const db = getDb()
    const result = await db.execute(sql`SELECT COUNT(*) AS total FROM sites`)
    const row = result.rows?.[0] as { total: string } | undefined
    expect(Number(row?.total)).toBeGreaterThanOrEqual(0)
  }, 15000)

  it("OK DB-03 can count rows in the fabs table", async () => {
    if (!hasDb) return
    const db = getDb()
    const result = await db.execute(sql`SELECT COUNT(*) AS total FROM fabs`)
    const row = result.rows?.[0] as { total: string } | undefined
    expect(Number(row?.total)).toBeGreaterThanOrEqual(0)
  }, 15000)

  it("OK DB-04 has the FAB workflow schema required by the FAB API", async () => {
    if (!hasDb) return
    const db = getDb()
    const result = await db.execute(sql`
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'fabs'
            AND column_name = 'workflow_status'
        ) AS has_workflow_status,
        to_regclass('public.fab_service_requests') IS NOT NULL AS has_service_requests
    `)
    const row = result.rows?.[0] as { has_workflow_status: boolean; has_service_requests: boolean } | undefined

    expect(row?.has_workflow_status).toBe(true)
    expect(row?.has_service_requests).toBe(true)
  }, 15000)

  it("OK DB-05 supports the interactive transaction required to save a FAB graph", async () => {
    if (!hasDb) return
    const db = getDb()
    const result = await db.transaction(async tx => tx.execute(sql`SELECT 1 AS one`))
    expect(result).toBeTruthy()
  }, 15000)})
