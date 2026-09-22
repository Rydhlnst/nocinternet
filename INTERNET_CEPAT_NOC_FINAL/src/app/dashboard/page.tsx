import Link from "next/link"
import { ArrowUpRight, CalendarClock, CircleAlert, Database, Gauge } from "lucide-react"
import { count, eq } from "drizzle-orm"
import { requireUser } from "@/lib/auth"
import { sites, fabs, upgrades, maintenance } from "@/lib/db/schema"

export default async function DashboardPage() {
  const { db } = await requireUser()
  const [siteCount, active, fabCount, upgradeCount, maintenanceCount] = await Promise.all([
    db.select({ value: count() }).from(sites),
    db.select({ value: count() }).from(sites).where(eq(sites.statusLayanan, "Aktif")),
    db.select({ value: count() }).from(fabs).where(eq(fabs.status, "Open")),
    db.select({ value: count() }).from(upgrades).where(eq(upgrades.status, "Requested")),
    db.select({ value: count() }).from(maintenance).where(eq(maintenance.status, "Scheduled")),
  ])

  return <div className="content">
    <div className="grid metric-grid">
      <Metric label="Total Site" value={siteCount[0]?.value ?? 0} note="Registered locations" />
      <Metric label="Layanan Aktif" value={active[0]?.value ?? 0} note="Operational services" />
      <Metric label="FAB Terbuka" value={fabCount[0]?.value ?? 0} note="Needs attention" />
      <Metric label="Upgrade Pending" value={upgradeCount[0]?.value ?? 0} note="Awaiting action" />
    </div>
    <div className="grid split">
      <section className="panel">
        <div className="panel-head"><h2>Quick actions</h2><span className="eyebrow">Today</span></div>
        <div className="panel-body grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <Action href="/dashboard/sites" icon={<Database size={18} />} title="Manage sites" text="Update site and service details" />
          <Action href="/dashboard/fabs" icon={<CircleAlert size={18} />} title="Review FAB / SO" text={`${fabCount[0]?.value ?? 0} request(s) need review`} />
          <Action href="/dashboard/upgrades" icon={<Gauge size={18} />} title="Track upgrades" text={`${upgradeCount[0]?.value ?? 0} request(s) in queue`} />
          <Action href="/dashboard/maintenance" icon={<CalendarClock size={18} />} title="Plan maintenance" text={`${maintenanceCount[0]?.value ?? 0} scheduled item(s)`} />
        </div>
      </section>
      <section className="panel">
        <div className="panel-head"><h2>System status</h2><span className="status status-active">Ready</span></div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--muted)", margin: 0 }}>Dashboard connected to Neon Postgres. Add your first site or import an Excel workbook to begin.</p>
          <Link className="btn btn-primary" href="/dashboard/sites">Open site database <ArrowUpRight size={14} /></Link>
        </div>
      </section>
    </div>
  </div>
}

function Metric({ label, value, note }: { label: string; value: number; note: string }) {
  return <div className="metric"><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div>
}

function Action({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link href={href} className="panel" style={{ padding: 16, textDecoration: "none", color: "inherit" }}><div style={{ color: "var(--accent)", marginBottom: 12 }}>{icon}</div><strong style={{ fontSize: 13 }}>{title}</strong><div style={{ color: "var(--muted)", fontSize: 11, marginTop: 6 }}>{text}</div></Link>
}
