import Link from "next/link"

export function Brand({ href = "/", compact = false, inverted = false }: { href?: string; compact?: boolean; inverted?: boolean }) {
  return (
    <Link href={href} className={`brand ${compact ? "brand-compact" : ""} ${inverted ? "brand-inverted" : ""}`} aria-label="Beranda Internet Cepat NOC">
      <span className="brand-mark" aria-hidden="true">IC</span>
      <span className="brand-copy"><strong>INTERNET CEPAT</strong><span>OPERASIONAL NOC</span></span>
    </Link>
  )
}
