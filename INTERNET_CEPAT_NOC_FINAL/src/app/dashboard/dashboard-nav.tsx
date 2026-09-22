"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Database, Gauge, LayoutDashboard, ShieldCheck, Users, Wrench } from "lucide-react"

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/sites", label: "Site Database", icon: Database },
  { href: "/dashboard/cids", label: "CID Tracking", icon: Activity },
  { href: "/dashboard/fabs", label: "FAB / SO", icon: ShieldCheck },
  { href: "/dashboard/upgrades", label: "Upgrade Bandwidth", icon: Gauge },
  { href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench },
  { href: "/dashboard/users", label: "Users", icon: Users },
]

export function DashboardNav() {
  const pathname = usePathname()

  return <nav className="dashboard-nav" aria-label="NOC navigation">
    <div className="nav-label">WORKSPACE</div>
    {links.map(({ href, label, icon: Icon }) => {
      const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
      return <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}><Icon size={17} strokeWidth={active ? 2.3 : 1.8} /><span>{label}</span></Link>
    })}
  </nav>
}
