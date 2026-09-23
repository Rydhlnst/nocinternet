import Link from "next/link"
import { and, count, eq, isNull } from "drizzle-orm"
import {
  RiMapPin2Line, RiSimCard2Line, RiFileList3Line, RiArrowUpCircleLine, RiToolsLine,
  RiCheckboxCircleLine, RiHourglassLine, RiCalendarLine, RiArrowRightLine,
  RiDatabaseLine,
} from "react-icons/ri"
import { requireUser } from "@/lib/auth"
import { sites, cids, fabs, upgrades, maintenance } from "@/lib/db/schema"

export default async function DashboardPage() {
  const { db, user } = await requireUser()

  const [
    [sitesTotal], [sitesAktif],
    [cidsTotal], [cidsAktif],
    [fabsTotal], [fabsOpen],
    [upgsTotal], [upgsPending],
    [mntTotal], [mntScheduled],
  ] = await Promise.all([
    db.select({ value: count() }).from(sites).where(isNull(sites.archivedAt)),
    db.select({ value: count() }).from(sites).where(and(isNull(sites.archivedAt), eq(sites.statusLayanan, "Aktif"))),
    db.select({ value: count() }).from(cids).where(isNull(cids.archivedAt)),
    db.select({ value: count() }).from(cids).where(and(isNull(cids.archivedAt), eq(cids.status, "Aktif"))),
    db.select({ value: count() }).from(fabs).where(isNull(fabs.archivedAt)),
    db.select({ value: count() }).from(fabs).where(and(isNull(fabs.archivedAt), eq(fabs.status, "Open"))),
    db.select({ value: count() }).from(upgrades).where(isNull(upgrades.archivedAt)),
    db.select({ value: count() }).from(upgrades).where(and(isNull(upgrades.archivedAt), eq(upgrades.status, "Requested"))),
    db.select({ value: count() }).from(maintenance).where(isNull(maintenance.archivedAt)),
    db.select({ value: count() }).from(maintenance).where(and(isNull(maintenance.archivedAt), eq(maintenance.status, "Scheduled"))),
  ])

  const firstName = (user.fullName ?? "NOC Staff").split(" ")[0]

  return (
    <div className="content">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <span className="eyebrow">OPERATIONAL REGISTER</span>
        <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: "var(--ink)" }}>
          Dashboard NOC
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
          Selamat datang, {firstName}. Ringkasan seluruh operasional jaringan aktif.
        </p>
      </div>

      {/* KPI cards — one per module */}
      <div className="kpi-grid" style={{ marginBottom: 28 }}>
        <ModuleKpi
          icon={<RiMapPin2Line size={22} style={{ color: "#16A34A" }} />}
          iconBg="#DCFCE7"
          total={sitesTotal?.value ?? 0}
          label="Site Database"
          sub={`${sitesAktif?.value ?? 0} site aktif`}
          href="/dashboard/sites"
        />
        <ModuleKpi
          icon={<RiSimCard2Line size={22} style={{ color: "#1D4ED8" }} />}
          iconBg="#DBEAFE"
          total={cidsTotal?.value ?? 0}
          label="CID Tracking"
          sub={`${cidsAktif?.value ?? 0} CID aktif`}
          href="/dashboard/cids"
        />
        <ModuleKpi
          icon={<RiFileList3Line size={22} style={{ color: "#7C3AED" }} />}
          iconBg="#EDE9FE"
          total={fabsTotal?.value ?? 0}
          label="FAB / SO"
          sub={`${fabsOpen?.value ?? 0} open`}
          href="/dashboard/fabs"
        />
        <ModuleKpi
          icon={<RiArrowUpCircleLine size={22} style={{ color: "#D97706" }} />}
          iconBg="#FEF9C3"
          total={upgsTotal?.value ?? 0}
          label="Upgrade Bandwidth"
          sub={`${upgsPending?.value ?? 0} pending`}
          href="/dashboard/upgrades"
        />
        <ModuleKpi
          icon={<RiToolsLine size={22} style={{ color: "#C2410C" }} />}
          iconBg="#FED7AA"
          total={mntTotal?.value ?? 0}
          label="Maintenance"
          sub={`${mntScheduled?.value ?? 0} scheduled`}
          href="/dashboard/maintenance"
        />
      </div>

      {/* Module panels — 3 + 2 grid */}
      <div className="module-panels-3">
        <ModulePanel
          href="/dashboard/sites"
          icon={<RiMapPin2Line size={20} />}
          iconBg="#DCFCE7"
          iconColor="#16A34A"
          title="Site Database"
          desc="Kelola seluruh lokasi site dan status layanan."
          stat={sitesTotal?.value ?? 0}
          statLabel="total site"
          badge={sitesAktif?.value ?? 0}
          badgeLabel="aktif"
          badgeColor="#15803D"
          badgeBg="#E9F9EF"
        />
        <ModulePanel
          href="/dashboard/cids"
          icon={<RiSimCard2Line size={20} />}
          iconBg="#DBEAFE"
          iconColor="#1D4ED8"
          title="CID Tracking"
          desc="Database Circuit ID dan status layanan customer."
          stat={cidsTotal?.value ?? 0}
          statLabel="total CID"
          badge={cidsAktif?.value ?? 0}
          badgeLabel="aktif"
          badgeColor="#15803D"
          badgeBg="#E9F9EF"
        />
        <ModulePanel
          href="/dashboard/fabs"
          icon={<RiFileList3Line size={20} />}
          iconBg="#EDE9FE"
          iconColor="#7C3AED"
          title="FAB / SO Tracking"
          desc="Pantau status Formulir Berlangganan dan Service Order."
          stat={fabsTotal?.value ?? 0}
          statLabel="total FAB"
          badge={fabsOpen?.value ?? 0}
          badgeLabel="open"
          badgeColor="#586774"
          badgeBg="#EFF3F6"
        />
      </div>
      <div className="module-panels-2">
        <ModulePanel
          href="/dashboard/upgrades"
          icon={<RiArrowUpCircleLine size={20} />}
          iconBg="#FEF9C3"
          iconColor="#D97706"
          title="Upgrade Bandwidth"
          desc="Kelola permintaan peningkatan bandwidth customer."
          stat={upgsTotal?.value ?? 0}
          statLabel="total request"
          badge={upgsPending?.value ?? 0}
          badgeLabel="pending"
          badgeColor="#966A13"
          badgeBg="#FFF7DF"
        />
        <ModulePanel
          href="/dashboard/maintenance"
          icon={<RiToolsLine size={20} />}
          iconBg="#FED7AA"
          iconColor="#C2410C"
          title="Maintenance"
          desc="Jadwal dan pengelolaan aktivitas maintenance jaringan."
          stat={mntTotal?.value ?? 0}
          statLabel="total tiket"
          badge={mntScheduled?.value ?? 0}
          badgeLabel="scheduled"
          badgeColor="#966A13"
          badgeBg="#FFF7DF"
        />
      </div>
    </div>
  )
}

function ModuleKpi({
  icon, iconBg, total, label, sub, href,
}: {
  icon: React.ReactNode; iconBg: string; total: number; label: string; sub: string; href: string
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="kpi-card" style={{ cursor: "pointer", transition: "box-shadow .15s" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div className="kpi-number">{total}</div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-pct">{sub}</div>
        </div>
      </div>
    </Link>
  )
}

function ModulePanel({
  href, icon, iconBg, iconColor, title, desc, stat, statLabel, badge, badgeLabel, badgeColor, badgeBg,
}: {
  href: string; icon: React.ReactNode; iconBg: string; iconColor: string
  title: string; desc: string; stat: number; statLabel: string
  badge: number; badgeLabel: string; badgeColor: string; badgeBg: string
}) {
  return (
    <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", color: iconColor, flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--ink)" }}>{title}</div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
        </div>
      </div>
      <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.03em", color: "var(--ink)" }}>{stat}</span>
          <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>{statLabel}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999, color: badgeColor, background: badgeBg }}>
            {badge} {badgeLabel}
          </span>
          <Link href={href} className="btn btn-secondary" style={{ fontSize: 11, padding: "5px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Lihat <RiArrowRightLine size={13} />
          </Link>
        </div>
      </div>
    </div>
  )
}
