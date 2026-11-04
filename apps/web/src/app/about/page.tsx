import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { PageHead, Shell } from "@/components/site/page-head";

const TEAM = ["Viral Dhoka", "Tanaya Thorat", "Nayan Thakare", "Shreenath Utekar"];

export default async function About() {
  const t = await getT();
  const c = t.site.about;
  return (
    <>
      <PageHead title={c.title} lede={c.lead} ribbon={[t.site.home.l1, t.site.home.l2]} />
      <Shell>
        <section className="card overflow-hidden p-0" aria-label={c.film}>
          <video controls preload="metadata" className="block aspect-video w-full bg-navy" poster="/film-poster.jpg" data-testid="film">
            <source src="/Sigil_56s.mp4" type="video/mp4" />
          </video>
        </section>
        {c.blocks.map((b) => (
          <section key={b.h} className="card p-5 sm:p-6">
            <h2 className="text-3xl">{b.h}</h2>
            <p className="mt-2 mb-0 text-lg font-medium">{b.p}</p>
          </section>
        ))}
        <section className="card p-5 sm:p-6">
          <h2 className="text-3xl">{c.statusTitle}</h2>
          <p className="mt-2 mb-0 text-lg font-medium">{c.status}</p>
        </section>
        <section className="halftone-royal rounded-[var(--r-card)] border-2 border-navy p-6 shadow-hard-2">
          <h2 className="text-4xl text-cream">{c.teamTitle}</h2>
          <ul className="mt-3 mb-0 grid list-none gap-1 p-0 text-lg font-bold sm:grid-cols-2">
            {TEAM.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <div className="mt-5 flex items-center gap-3 rounded-[var(--r-sm)] bg-paper p-3 text-navy">
            <Image src="/cesac/cesac-mark-96.png" alt="" width={36} height={38} />
            <span className="font-bold">{t.site.footer.cesac}</span>
          </div>
        </section>
      </Shell>
    </>
  );
}
