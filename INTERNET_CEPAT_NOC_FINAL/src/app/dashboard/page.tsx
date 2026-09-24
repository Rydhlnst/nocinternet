import { AlertCircle } from "lucide-react"
import { requireUser } from "@/lib/auth"
import { getDashboardViewModel } from "./dashboard-data"
import { DashboardOverviewClient } from "./dashboard-overview-client"

export default async function DashboardPage() {
  const { db, user } = await requireUser()
  const firstName = (user.fullName ?? "NOC Staff").split(" ")[0]

  try {
    const viewModel = await getDashboardViewModel(db)
    return <DashboardOverviewClient firstName={firstName} viewModel={viewModel} />
  } catch {
    return <div className="content ops-overview"><section className="ops-error" role="alert"><AlertCircle size={20} aria-hidden="true" /><div><span className="eyebrow">NETWORK OPERATIONS CENTER</span><h1>Operational Overview</h1><p>Data dashboard belum dapat dimuat. Periksa koneksi lalu coba kembali.</p><a className="btn btn-secondary" href="/dashboard">Muat ulang</a></div></section></div>
  }
}