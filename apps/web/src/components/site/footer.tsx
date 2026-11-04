import Link from "next/link";
import type { Dict } from "@/lib/i18n";
import { Curve } from "@/components/f4/home";

// CESAC's footer (components/site/footer.tsx): curved line, closing statement, link columns.
// The CESAC mark appears here as team branding.
export function FooterBody({ t }: { t: Dict }) {
  const f = t.site.footer;
  const n = t.site.nav;
  const cols: [string, [string, string][]][] = [
    [f.product, [["/check", n.check], ["/wallet", n.wallet], ["/sign", n.sign], ["/recruiter", n.recruiter], ["/paper", n.paper]]],
    [f.trust, [["/registry", n.registry], ["/about", n.about], ["/faq", t.site.faq.title], ["/developers", t.site.dev.title]]],
    [f.legal, [["/privacy", t.site.privacy.title], ["/terms", t.site.terms.title]]],
  ];
  return (
    <footer className="sec foot wrap">
      <Curve id="f4-curve-foot" className="" d="M-40 150 C 300 10, 900 10, 1240 150" text={f.curve} colour="var(--ember)" />
      <h2 className="closing">
        <span className="ln">
          <span>{f.l1}</span>
        </span>
        <span className="ln">
          <span>{f.l2}</span>
        </span>
      </h2>
      <div className="foot-cols">
        <div>
          <span className="foot-brand">
            <span className="mark" />
            Sigil
          </span>
          <p>{f.blurb}</p>
        </div>
        {cols.map(([title, links]) => (
          <nav key={title} aria-label={title}>
            <span className="label">{title}</span>
            {links.map(([href, label]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="foot-row">
        <span>{f.cesac}</span>
        <div>
          <span className="cesac-mark text-2xl" aria-hidden />
          <a className="out" href="https://github.com/viralala/sigil" target="_blank" rel="noopener noreferrer">
            {f.code}
          </a>
        </div>
      </div>
      <div className="foot-row">
        <span>© {new Date().getFullYear()} Team Sigil</span>
        <span>{f.note}</span>
      </div>
    </footer>
  );
}

export function SiteFooter({ t }: { t: Dict }) {
  return (
    <div className="f4 f4-foot-only">
      <FooterBody t={t} />
    </div>
  );
}
