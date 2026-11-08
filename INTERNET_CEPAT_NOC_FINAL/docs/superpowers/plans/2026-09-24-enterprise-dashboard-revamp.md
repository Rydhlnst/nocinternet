# Enterprise Dashboard Revamp Implementation Plan

> **For implementation:** Execute this plan using the `superpowers:executing-plans` skill, one task at a time.

**Goal:** Replace the current `/dashboard` module-card layout with a compact, data-driven NOC overview that uses only verified operational data and works cleanly across desktop and mobile.

**Architecture:** Keep database access in the server-rendered dashboard page. A dedicated data composer will make the totals, distributions, action queue, and recent-record feed explicit and typed. A small client presentation layer will own only the Refresh interaction, so rendering, empty states, and error states remain deterministic and do not expose raw data.

**Tech Stack:** Next.js App Router, React, TypeScript, Drizzle ORM, PostgreSQL/Neon, React Icons, CSS in `src/app/globals.css`, Vitest.

---

## Global constraints

- Change only dashboard presentation and the neutral dashboard chrome copy; do not alter schemas, migrations, API contracts, seed data, role checks, or resource CRUD pages.
- Use only database-backed totals, statuses, timestamps, and records. Do not add trends, uptime claims, health claims, event feeds, fake notification counts, or fabricated names/dates.
- Preserve the existing `CellValue` safety contract for resource pages. This dashboard must also never render JSON, arrays, `null`, `undefined`, or object stringification.
- Keep the existing sidebar information groups and account/logout controls. The active navigation style must remain borderless on its sides.
- Do not turn an unavailable database into zero counts. A query failure must render the dashboard error state.

## File structure

| File | Responsibility |
| --- | --- |
| `src/app/dashboard/dashboard-data.ts` | Typed server-side query composition plus pure view-model helpers. |
| `src/app/dashboard/dashboard-overview-client.tsx` | Refresh behavior and typed dashboard presentation. |
| `src/app/dashboard/page.tsx` | Auth boundary, server data loading, and error fallback. |
| `src/app/dashboard/layout.tsx` | Remove unverified availability language and non-functional notification control. |
| `src/app/globals.css` | Namespaced `ops-` dashboard layout, responsive rules, and compact states. |
| `tests/unit/dashboard-data.test.ts` | Unit tests for mapping, sorting, status aggregation, and non-zero action filtering. |
| `tests/unit/dashboard-layout.test.ts` | Update structural assertions for the enterprise overview. |

## Task 1: Define a typed dashboard view model and pure transformations

**Files:**
- Create: `src/app/dashboard/dashboard-data.ts`
- Create: `tests/unit/dashboard-data.test.ts`

1. Start with failing unit tests for pure helpers:
   - known status rows produce module distributions with actual counts;
   - an unknown or empty status is displayed as a safe neutral label rather than failing or disappearing;
   - only `Open` FAB, `Requested` Upgrade Bandwidth, and `Scheduled` Maintenance create action rows, and rows with count `0` are excluded;
   - five module recent-record collections merge, sort by `updatedAt` descending, and return only the newest eight records;
   - missing/invalid timestamps use a safe display fallback and never cause an invalid Date render.
2. Add exported data contracts, for example:
   ```ts
   export type DashboardModule = "sites" | "cids" | "fabs" | "upgrades" | "maintenance"

   export type DashboardKpi = {
     module: DashboardModule
     label: string
     total: number
     contextLabel: string
     contextValue: number
     href: string
   }

   export type DashboardRecentRecord = {
     id: string
     module: DashboardModule
     moduleLabel: string
     label: string
     status: string | null
     updatedAt: Date | null
     href: string
   }
   ```
3. Implement pure helper functions (`buildStatusDistribution`, `buildActionItems`, `buildRecentRecords`, date/status label formatting) to satisfy the tests. Keep their input primitive and serializable where possible so the test suite does not need a database.
4. Define a typed `DashboardViewModel` containing `loadedAt`, the five KPI objects, five actual status distributions, the filtered action items, and recent records.

## Task 2: Compose verified dashboard data on the server

**Files:**
- Modify: `src/app/dashboard/dashboard-data.ts`
- Modify: `tests/unit/dashboard-data.test.ts`

1. Add `getDashboardViewModel(db)` to query only non-archived records.
2. Reuse the current five KPI definitions and contextual counts:
   - Sites: total non-archived and `statusLayanan === "Aktif"`.
   - CID Tracking: total non-archived and `status === "Aktif"`.
   - FAB / SO: total non-archived and `status === "Open"`.
   - Upgrade Bandwidth: total non-archived and `status === "Requested"`.
   - Maintenance: total non-archived and `status === "Scheduled"`.
3. Query each module’s real status distribution with a grouped `count()` query and `archivedAt IS NULL`. Preserve every database status value, including values outside the usual workflow, using the safe status formatter from Task 1.
4. Query a small, bounded recent candidate list per module, selecting only id, an existing identifying field, status, and `updatedAt`:
   - Site: `namaSite`, `statusLayanan`.
   - CID: `cidNumber`, `status`.
   - FAB: `fabNumber`, `status`.
   - Upgrade: current/requested bandwidth with `status`.
   - Maintenance: `maintenanceType` with `status`.
5. Pass those candidates into `buildRecentRecords`, merge/sort/slice there, and link every item to its actual module route.
6. Do not query or present audit logs as a substitute for records. The panel title must be `Recently Updated Records`, because it is based on real `updatedAt` fields.
7. Extend the test fixtures with an unknown status and a record missing a label/timestamp; confirm the output uses component-safe fallback text rather than serializing source values.

## Task 3: Replace the page shell with server loading and explicit error handling

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `tests/unit/dashboard-layout.test.ts`

1. Keep `requireUser()` outside the data-fetch `try` block so authentication redirects retain their current behavior.
2. Load `getDashboardViewModel(db)` in a `try` block.
3. On success, pass the typed view model and user first name to `DashboardOverviewClient`.
4. On database failure, render a compact dashboard-local error panel with:
   - eyebrow `NETWORK OPERATIONS CENTER`;
   - title `Operational Overview`;
   - clear Indonesian copy that the operational data could not be loaded;
   - a browser reload action only when it can perform a real retry.
5. Do not retain the old hard-coded `Database terhubung` badge, `OPERATIONAL REGISTER`, `Dashboard NOC`, duplicated `ModulePanel` cards, or zero-valued fallback dashboard.
6. Update layout tests to assert the new heading/content composition and removal of the obsolete availability copy.

## Task 4: Implement compact, data-driven dashboard components

**Files:**
- Create: `src/app/dashboard/dashboard-overview-client.tsx`
- Modify: `tests/unit/dashboard-layout.test.ts`

1. Implement a client component with the minimal boundary required for a real Refresh control:
   ```tsx
   "use client"

   const [isRefreshing, startTransition] = useTransition()
   const refresh = () => startTransition(() => router.refresh())
   ```
   Disable the button while refreshing and replace its label with a loading label.
2. Render the header from verified data:
   - eyebrow: `NETWORK OPERATIONS CENTER`;
   - title: `Operational Overview`;
   - subtitle: `Ringkasan kondisi operasional jaringan dan aktivitas terbaru.`;
   - factual `Data dimuat` timestamp based only on `viewModel.loadedAt`;
   - the real Refresh button. Do not show connection/health indicators.
3. Render exactly five compact KPI cards from the view model. Each card must show the module label, total, actual contextual status count, icon, and real module link. Use the same fixed card minimum height and grid alignment for every module.
4. Render a `Status Overview` panel using the grouped distributions. For each module show a compact status/count representation. When a distribution has no rows, show a component-level empty message such as `Belum ada data status.` rather than an empty array or fake status.
5. Render `Action Required` from the pre-filtered action items. If none exist, show `Tidak ada tindakan operasional yang teridentifikasi.` Do not show rows or badges for zero counts.
6. Render `Recently Updated Records` from the real recent feed. Each row shows record label, module label, safe status text, formatted updated timestamp, and a working link. If no records exist, show a concise empty state.
7. Do not add Quick Access unless the finished layout has an actual access gap. The KPI cards and record links are existing working shortcuts; adding redundant navigation would reduce information density.
8. Ensure all display values are strings/numbers prepared by the view model or pass through explicit safe display helpers. Do not render `JSON.stringify`, raw React values, arrays, arbitrary objects, or nullish values.

## Task 5: Update dashboard chrome without unverified UI claims

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `src/app/dashboard/dashboard-nav.tsx` only if a class name is needed for responsive styling
- Modify: `src/app/globals.css`
- Modify: `tests/unit/dashboard-layout.test.ts`

1. Keep the existing sidebar navigation groups: Workspace, Network Management, Operations, and Administration.
2. Replace the footer statement `Systems operational` with neutral product information such as `Operational workspace`; preserve the brand/year label.
3. Remove the bell control unless it has real notification behavior. Keep the existing account identity and logout action, since both are functional.
4. Add scoped `ops-` styles for:
   - a dense overview header with actions aligned on desktop and stacked on narrow screens;
   - five equal-height KPI cards in a five-column desktop grid, two/three-column intermediate grid, and single column mobile grid;
   - a balanced two-column detail region that becomes one column at smaller widths;
   - recent records that remain readable at small widths (stacked metadata rather than horizontal overflow);
   - compact empty/error panels with no misleading border accents;
   - visible keyboard focus and accessible contrast.
5. Preserve the current borderless active sidebar item treatment. Do not introduce one-sided colored borders in cards, nav items, or status panels.
6. Remove obsolete `.module-*` dashboard styles only after confirming they are not used by another page. Keep unrelated existing global styles unchanged.

## Task 6: Validate, inspect, and prepare the change

**Files:**
- Modify only files required by preceding tasks.

1. Run focused Vitest tests for dashboard data, layout, and safe value rendering.
2. Run the full unit suite.
3. Run `pnpm lint` and `pnpm exec tsc --noEmit`.
4. Run `pnpm build`. If static generation remains blocked by the known persistent Neon pool lifecycle after compilation and type checking, capture the exact stage, stop only the process started for this task, and report the limitation rather than treating it as a passing build.
5. Inspect `git diff --check`, `git diff --stat`, and the final diff to ensure no seed records, configuration secrets, raw data output, or unrelated workspace changes are included.
6. Review desktop and narrow layout in the running application if available. Verify actual counts, action filtering, empty state, error state, refresh state, working resource links, no side borders, and no serialized values.

## Review focus

- A completely empty database must show truthful empty component states and never claim network/system health.
- A dashboard query error must remain an error state, never transform into a set of zero KPI cards.
- Actions must be present only for the three defined status/count combinations and only when their count is non-zero.
- Records with absent labels, absent timestamps, or unexpected status values must stay human-readable without leaking JSON, arrays, nulls, or invalid dates.
- The responsive KPI grid must retain equal card heights and the active navigation item must remain free of one-sided borders.
