import { Bell, ChevronRight } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { Brand } from "@/components/brand"
import { LogoutButton } from "./logout-button"
import { DashboardNav } from "./dashboard-nav"

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireUser()
  const initial = (user.fullName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()

  return <div className="shell">
    <aside className="sidebar">
      <div className="sidebar-brand"><Brand href="/dashboard" /></div>
      <DashboardNav />
      <div className="sidebar-footer"><div className="sidebar-footer-status"><span className="status-dot" /> Systems operational</div><span>Internet Cepat NOC · 2026</span></div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="breadcrumb"><span>NOC Workspace</span><ChevronRight size={14} /><strong>Operations</strong></div>
        <div className="topbar-actions"><button className="icon-button" aria-label="Notifications"><Bell size={17} /></button><div className="user-pill"><div className="avatar">{initial}</div><div className="user-meta"><strong>{user.fullName ?? "NOC Staff"}</strong><span>{user.email}</span></div><LogoutButton /></div></div>
      </header>
      {children}
    </main>
  </div>
}
