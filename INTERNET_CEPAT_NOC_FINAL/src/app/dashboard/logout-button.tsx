"use client"
import { LogOut } from "lucide-react"
import { createAuthClient } from "better-auth/react"
import { useRouter } from "next/navigation"
const authClient = createAuthClient()
export function LogoutButton() { const router = useRouter(); return <button aria-label="Keluar" className="btn btn-secondary" onClick={async () => { await authClient.signOut(); router.push("/login"); router.refresh() }}><LogOut size={14} /></button> }
