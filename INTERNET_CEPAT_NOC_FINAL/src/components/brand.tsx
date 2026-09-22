import Link from "next/link"

export function Brand({ href = "/", compact = false, inverted = false }: { href?: string; compact?: boolean; inverted?: boolean }) {
  const color = inverted ? "#ffffff" : "#10233f"
  return <Link href={href} className={`brand ${compact ? "brand-compact" : ""} ${inverted ? "brand-inverted" : ""}`} style={{ textDecoration: "none", color }} aria-label="Internet Cepat NOC home"><span className="brand-mark" aria-hidden="true">IC</span><span className="brand-copy"><strong style={{ color }}>INTERNET CEPAT</strong><span style={{ color: inverted ? "#aab8cb" : "#6c7a90" }}>NOC OPERATIONS</span></span></Link>
}
