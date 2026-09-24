"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ArrowRight, ClipboardList, Database, Gauge, MapPin, RefreshCw, Router, Wrench } from "lucide-react"
import type { ComponentType } from "react"
import type { DashboardModule, DashboardViewModel } from "./dashboard-data"

const moduleIcons: Record<DashboardModule, ComponentType<{ className?: string }>> = {
  sites: MapPin,
  cids: Router,
  fabs: ClipboardList,
  upgrades: Gauge,
  maintenance: Wrench,
}

export function DashboardOverviewClient({ firstName, viewModel }: { firstName: string; viewModel: DashboardViewModel }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const refresh = () => startTransition(() => router.refresh())

  return <div className="content ops-overview">
    <header className="ops-header">
      <div>
        <span className="eyebrow">NETWORK OPERATIONS CENTER</span>
        <h1>Operational Overview</h1>
        <p>Ringkasan kondisi operasional jaringan dan aktivitas terbaru.</p>
        <span className="ops-loaded">Halo, {firstName}. Data dimuat: {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(viewModel.loadedAt))} WIB</span>
      </div>
      <button type="button" className="btn btn-secondary ops-refresh" onClick={refresh} disabled={isRefreshing}>
        <RefreshCw className={isRefreshing ? "ops-spin" : ""} size={15} />{isRefreshing ? "Memuat ulang..." : "Refresh"}
      </button>
    </header>

    <section aria-label="Ringkasan modul" className="ops-kpi-grid">
      {viewModel.kpis.map((kpi) => {
        const Icon = moduleIcons[kpi.module]
        return <Link href={kpi.href} className="ops-kpi" key={kpi.module}>
          <span className={`ops-kpi-icon ops-kpi-icon-${kpi.module}`}><Icon /></span>
          <span className="ops-kpi-copy"><span>{kpi.label}</span><strong>{kpi.total}</strong><small>{kpi.contextValue} {kpi.contextLabel}</small></span>
          <ArrowRight className="ops-kpi-arrow" size={16} aria-hidden="true" />
        </Link>
      })}
    </section>

    <section className="ops-grid" aria-label="Status dan tindakan operasional">
      <article className="ops-panel"><div className="ops-panel-heading"><div><span className="eyebrow">LIVE DATA</span><h2>Status Overview</h2></div><Database size={18} aria-hidden="true" /></div>
        <div className="ops-status-list">{viewModel.distributions.map((distribution) => <div className="ops-status-module" key={distribution.module}><strong>{distribution.label}</strong>{distribution.items.length ? <div>{distribution.items.map((item) => <span className="ops-status-pill" key={`${item.label}-${item.count}`}>{item.label}<b>{item.count}</b></span>)}</div> : <p>Belum ada data status.</p>}</div>)}</div>
      </article>
      <article className="ops-panel"><div className="ops-panel-heading"><div><span className="eyebrow">WORK QUEUE</span><h2>Action Required</h2></div></div>
        {viewModel.actions.length ? <div className="ops-actions">{viewModel.actions.map((action) => <Link href={action.href} key={action.href}><span>{action.label}</span><strong>{action.count}</strong><ArrowRight size={15} /></Link>)}</div> : <div className="ops-empty">Tidak ada tindakan operasional yang teridentifikasi.</div>}
      </article>
    </section>

    <section className="ops-panel ops-recent"><div className="ops-panel-heading"><div><span className="eyebrow">ACTIVITY</span><h2>Recently Updated Records</h2></div></div>
      {viewModel.recentRecords.length ? <div className="ops-recent-list">{viewModel.recentRecords.map((record) => <Link href={record.href} key={`${record.module}-${record.id}`}><span className="ops-record-title"><strong>{record.label}</strong><small>{record.moduleLabel}</small></span><span className="ops-record-status">{record.statusLabel}</span><time dateTime={record.updatedAt?.toISOString()}>{record.updatedAtLabel}</time><ArrowRight size={15} aria-hidden="true" /></Link>)}</div> : <div className="ops-empty">Belum ada rekaman operasional untuk ditampilkan.</div>}
    </section>
  </div>
}