import { requireAdmin } from "@/lib/admin-auth"
import { UsersClient } from "./users-client"
export default async function UsersPage() { await requireAdmin(); return <div className="content"><div className="eyebrow">Administration</div><h1 style={{ margin: "5px 0 24px", fontSize: 26 }}>User Management</h1><UsersClient /></div> }
