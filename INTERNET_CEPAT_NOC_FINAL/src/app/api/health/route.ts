import { getDb } from "@/lib/db"
import { sql } from "drizzle-orm"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await getDb().execute(sql`SELECT 1`)
    return NextResponse.json({ status: "ok" })
  } catch {
    return NextResponse.json({ status: "error" }, { status: 503 })
  }
}
