"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Database, Gauge, LayoutDashboard, ShieldCheck, Users, Wrench } from "lucide-react"

type NavGroup = { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }

const groups: NavGroup[] = [
  {
    label: "WORKSPACE",
    items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    label: "NETWORK MANAGEMENT",
    items: [
      { href: "/dashboard/sites", label: "Site Database", icon: Database },
      { href: "/dashboard/cids", label: "CID Tracking", icon: Activity },
      { href: "/dashboard/fabs", label: "FAB / SO", icon: ShieldCheck },
      { href: "/dashboard/upgrades", label: "Upgrade Bandwidth", icon: Gauge },
    ],
  },
  {
    label: "OPERATIONS",
    items: [{ href: "/dashboard/maintenance", label: "Maintenance", icon: Wrench }],
  },
  {
    label: "ADMINISTRATION",
    items: [{ href: "/dashboard/users", label: "Users", icon: Users }],
  },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="dashboard-nav" aria-label="NOC navigation">
      {groups.map(group => (
        <div className="nav-group" key={group.label}>
          <div className="nav-label">{group.label}</div>
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)
            return (
              <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}>
                <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                <span>{label}</span>
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
