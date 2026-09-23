import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const routePath = resolve(process.cwd(), "src/app/api/fabs/route.ts")

describe("FAB API authentication", () => {
  it("returns 401 before handling FAB errors when no user session exists", async () => {
    const route = await readFile(routePath, "utf8")

    expect(route).toContain('import { getCurrentUser } from "@/lib/auth"')
    expect(route).toMatch(/const user = await getCurrentUser\(\)\s*if \(!user\) return NextResponse\.json\(\{ error: "Unauthorized" \}, \{ status: 401 \}\)/)
  })
})
