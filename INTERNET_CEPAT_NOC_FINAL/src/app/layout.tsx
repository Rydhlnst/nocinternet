import type { Metadata } from "next"
import { ToastProvider } from "@/components/toast"
import "./globals.css"

export const metadata: Metadata = { title: "Internet Cepat NOC", description: "Network Operation Center dashboard" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body><ToastProvider>{children}</ToastProvider></body></html>
}
