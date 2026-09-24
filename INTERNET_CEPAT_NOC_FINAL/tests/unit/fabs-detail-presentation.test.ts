import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const clientPath = resolve(process.cwd(), "src/app/dashboard/fabs/fabs-client.tsx")

describe("FAB detail presentation", () => {
  it("renders structured fields and empty states instead of raw JSON", async () => {
    const client = await readFile(clientPath, "utf8")
    const detail = client.slice(client.indexOf("function FabDetail"))

    expect(detail).not.toContain("JSON.stringify")
    expect(detail).toContain("<DetailEmpty")
    expect(client).toContain("Tidak ada data untuk ditampilkan.")
  })
})
