"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react"

type ToastKind = "success" | "error" | "info"
type ToastItem = { id: number; title: string; message?: string; kind: ToastKind }
type ToastContextValue = { showToast: (title: string, message?: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const showToast = useCallback((title: string, message?: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random()
    setItems(current => [...current, { id, title, message, kind }])
    window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 5000)
  }, [])
  const value = useMemo(() => ({ showToast }), [showToast])
  return <ToastContext.Provider value={value}>{children}<div aria-live="polite" aria-atomic="true" style={{ position: "fixed", top: 18, right: 18, zIndex: 50, display: "grid", gap: 10, width: "min(380px, calc(100vw - 32px))" }}>{items.map(item => <Toast key={item.id} item={item} onClose={() => setItems(current => current.filter(value => value.id !== item.id))} />)}</div></ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used inside ToastProvider")
  return context
}

function Toast({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const Icon = item.kind === "success" ? CheckCircle2 : item.kind === "error" ? CircleAlert : Info
  const color = item.kind === "success" ? "#15803D" : item.kind === "error" ? "#B42318" : "#52616D"
  const background = item.kind === "success" ? "#F0FDF4" : item.kind === "error" ? "#FFF1F0" : "#F7F9FB"
  return <div role="status" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", border: "1px solid #D9E1E8", borderLeft: `3px solid ${color}`, borderRadius: 10, background, color: "#1B232B", boxShadow: "0 12px 30px #1B232B1A" }}><Icon size={18} color={color} style={{ flex: "0 0 auto", marginTop: 1 }} /><div style={{ flex: 1, fontSize: 12, lineHeight: 1.5 }}><strong style={{ display: "block", fontSize: 13 }}>{item.title}</strong>{item.message && <span style={{ color: "#66717C" }}>{item.message}</span>}</div><button type="button" onClick={onClose} aria-label="Tutup notifikasi" style={{ border: 0, background: "transparent", color: "#89949E", padding: 0 }}><X size={15} /></button></div>
}
