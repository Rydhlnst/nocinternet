"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

type NavItem = { href: string; label: string; icon: LucideIcon }

export function DashboardNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="dashboard-nav" aria-label="NOC navigation">
      <div className="nav-label">WORKSPACE</div>
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href)

        return (
          <Link className={`nav-link ${active ? "active" : ""}`} href={href} key={href}>
            <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
