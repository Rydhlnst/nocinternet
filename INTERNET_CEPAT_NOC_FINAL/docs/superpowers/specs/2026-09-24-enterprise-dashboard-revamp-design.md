# Enterprise Dashboard Revamp Design

## Objective

Transform the existing NOC overview into a compact operational dashboard that uses only verified database data. The dashboard must help staff see module volume, status distribution, pending follow-up, and recently updated records without changing existing routes, permissions, or API contracts.

## Scope

The revamp applies to `/dashboard` and its presentation components. The existing sidebar and topbar retain their routes, account controls, and navigation groups. Their unverified health copy is replaced with neutral product information.

## Data model and sources

The server page already receives an authenticated database client through `requireUser()`.

- KPI totals: active, non-archived rows in `sites`, `cids`, `fabs`, `upgrades`, and `maintenance`.
- KPI contextual counts: `Aktif` sites and CIDs; `Open` FABs; `Requested` upgrades; `Scheduled` maintenance.
- Status overview: grouped counts from the real status columns of each module, excluding archived records.
- Action Required: only non-zero counts for Open FABs, Requested upgrades, and Scheduled maintenance. Each action links to the respective existing module route.
- Recent records: the newest non-archived rows across all five module tables, ordered by actual `updatedAt`. The view is titled “Recently Updated Records”; it is not presented as an audit log.

No trends, health indicators, event messages, search, polling, or status categories are fabricated.

## Architecture

`src/app/dashboard/page.tsx` remains the authenticated server component and composes a typed dashboard view model from database queries. It passes that model to a route-local client presentation component.

The client component owns only the functional Refresh action using `router.refresh()`. It shows a disabled state while refreshing. Server-side query failures are caught at the dashboard boundary and rendered as a safe error state; a failed query never becomes a numeric zero.

Presentational responsibilities are split into small route-local components:

- `DashboardHeader`: eyebrow, title, subtitle, data-loaded timestamp, refresh control.
- `OperationalKpiCard`: total, contextual count, module route, and status cue.
- `OperationalStatusOverview`: real per-status counts and percentage bars with empty handling.
- `ActionRequiredPanel`: verified follow-up counts with module navigation.
- `RecentOperationalRecords`: 5–8 actual records with module, status, updated time, and route.
- `QuickAccessModules`: compact module links only when it improves navigation without duplicating KPI content.

`CellValue` remains the fallback in shared module tables; dashboard-specific status and identifier formatting is explicit and does not render nested data.

## Visual and responsive design

The overview uses existing semantic CSS variables, compact surfaces, 8–10px radii, restrained orange accents, tabular metric numerals, and existing icon libraries. The five KPI cards use a five-column large-desktop grid that reduces to three, two, then one column. Status/action panels become a single column on narrow displays, and the recent-records table retains safe horizontal overflow.

No large illustration, decorative chart, fake system-health badge, or repeated oversized module card is added. Keyboard focus and non-color status labels remain visible.

## State handling

- Success: real metrics and records.
- Empty: explicit no-record/no-action message after successful queries.
- Refreshing: button progress state while the current route is refreshed.
- Error: non-sensitive message and retry action without reporting an arbitrary zero.

## Validation

- Unit-test the dashboard view-model helpers for totals, action selection, and safe empty distributions.
- Add dashboard layout coverage for the real dashboard sections and module routes.
- Run the full Vitest suite, `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build`.

## Non-goals

- No schema changes, new API endpoints, authorization changes, new state library, charting dependency, or fabricated live data.
- No changes to module CRUD pages beyond preserving their shared safe cell renderer.
