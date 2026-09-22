import Link from "next/link"
import { ArrowRight, Gauge, Network, ShieldCheck } from "lucide-react"
import { Brand } from "@/components/brand"
import styles from "./landing.module.css"

export default function Home() {
  return (
    <main className={styles.page}>
      <nav className={styles.nav}>
        <Brand />
        <div className={styles.navActions}>
          <Link className={styles.navLink} href="#capabilities">Kemampuan</Link>
          <Link className={styles.secondary} href="/login">Masuk</Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}>Pusat operasi jaringan</div>
          <h1 className={styles.title}>Setiap koneksi, tetap terkendali.</h1>
          <p className={styles.intro}>Ruang kerja operasional terpusat untuk tim Internet Cepat dalam memantau site, mengoordinasikan perubahan layanan, dan menjaga pekerjaan jaringan terus berjalan.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/login">Buka ruang operasi <ArrowRight size={15} /></Link>
            <Link className={styles.secondary} href="#capabilities">Lihat kemampuan</Link>
          </div>
        </div>
        <div className={styles.visual} aria-label="Pratinjau status operasi jaringan">
          <div className={styles.panel}>
            <div className={styles.panelTop}><span>Operasi langsung</span><span className={styles.online}>● Sistem siap</span></div>
            <div className={styles.signal}>{[38, 60, 45, 78, 58, 92, 66, 84, 70, 98, 76, 88].map((height, index) => <span className={styles.bar} style={{ height: `${height}%` }} key={index} />)}</div>
            <div className={styles.panelFooter}><div><div className={styles.metricValue}>24/7</div><div className={styles.metricLabel}>Visibilitas operasional</div></div><div className={styles.metricRight}><div className={styles.metricValue}>1 ruang</div><div className={styles.metricLabel}>Untuk setiap alur kerja</div></div></div>
          </div>
        </div>
      </section>

      <section className={styles.features} id="capabilities">
        <div className={styles.featureGrid}>
          <Feature number="01" icon={<Network size={19} />} title="Kenali setiap site" text="Simpan identitas site, bandwidth, VLAN, kontak, dan status layanan dalam satu register yang tepercaya." />
          <Feature number="02" icon={<Gauge size={19} />} title="Dorong pekerjaan maju" text="Lacak CID, FAB/SO, upgrade, dan maintenance dari permintaan hingga selesai." />
          <Feature number="03" icon={<ShieldCheck size={19} />} title="Beroperasi dengan kendali" text="Akses berbasis peran, jejak audit, dan data operasional yang tervalidasi untuk tim Anda." />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div><Brand href="/" compact inverted /><p className={styles.footerDescription}>Satu ruang kerja untuk menjaga layanan Internet Cepat tetap terhubung, tertata, dan siap dioperasikan.</p></div>
            <div className={styles.footerLinks}><span className={styles.footerLabel}>Ruang kerja</span><Link href="/login">Masuk ke dashboard</Link><Link href="#capabilities">Kemampuan platform</Link></div>
          </div>
          <div className={styles.footerBottom}><span>© 2026 Internet Cepat NOC</span><span>Operasional lebih terarah, koneksi lebih siap.</span></div>
        </div>
      </footer>
    </main>
  )
}

function Feature({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return <article className={styles.feature}><div className={styles.featureNumber}>{number} <span className={styles.featureIcon}>{icon}</span></div><h2>{title}</h2><p>{text}</p></article>
}
