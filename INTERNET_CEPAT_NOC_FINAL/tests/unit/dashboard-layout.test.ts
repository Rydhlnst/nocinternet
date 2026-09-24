import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const globalsCss = resolve(process.cwd(), "src/app/globals.css")

describe("dashboard layout", () => {
  it("keeps KPI cards at one consistent height", async () => {
    const css = await readFile(globalsCss, "utf8")

    expect(css).toMatch(/\.kpi-card\s*\{[^}]*min-height:\s*102px;/s)
  })

  it("uses a borderless active navigation state", async () => {
    const css = await readFile(globalsCss, "utf8")

    expect(css).toMatch(/\.nav-link\.active\s*\{[^}]*border:\s*0;/s)
  })

  it("does not use side borders on KPI tiles", async () => {
    const css = await readFile(globalsCss, "utf8")
    const tileRules = css.match(/\.kpi-tile(?:\.[\w-]+)*\s*\{[^}]*\}/gs) ?? []

    expect(tileRules.join("\n")).not.toContain("border-left")
  })
})

it("loads the enterprise overview server-side and retains a truthful error state", async () => {
  const page = await readFile(resolve(process.cwd(), "src/app/dashboard/page.tsx"), "utf8")
  expect(page).toContain("getDashboardViewModel")
  expect(page).toContain("Operational Overview")
  expect(page).toContain("Data dashboard belum dapat dimuat")
  expect(page).not.toContain("Database terhubung")
})

it("keeps the narrow-screen sidebar compact and horizontal", async () => {
  const css = await readFile(globalsCss, "utf8")
  expect(css).toMatch(/@media \(max-width: 960px\)\s*\{[\s\S]*?\.shell\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\);/)
  expect(css).toMatch(/@media \(max-width: 960px\)\s*\{[\s\S]*?\.nav-group\s*\{[^}]*display:\s*contents;/)
})

it("uses readable contrast for operational metadata", async () => {
  const css = await readFile(globalsCss, "utf8")
  for (const selector of [".ops-loaded", ".ops-kpi-copy small", ".ops-record-title small, .ops-recent-list time"]) {
    expect(css).toMatch(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{[^}]*color:var\\(--muted\\);`))
  }
})
