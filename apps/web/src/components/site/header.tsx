"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "./i18n-provider";
import { LanguageSwitcher } from "./language-switcher";
import { SigilLogo } from "./sigil-logo";

// CESAC's bar: flat on the page at rest, lifts into a floating outlined bar on scroll. Rounded, never a pill.
export function SiteHeader() {
  const { t } = useI18n();
  const n = t.site.nav;
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const nav = [
    ["/check", n.check],
    ["/wallet", n.wallet],
    ["/sign", n.sign],
    ["/recruiter", n.recruiter],
    ["/paper", n.paper],
    ["/registry", n.registry],
    ["/about", n.about],
  ];

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1280px] items-center gap-3 rounded-[16px] border-2 px-3 py-2 transition-all duration-300",
          lifted || open ? "border-navy bg-paper shadow-hard-2" : "border-transparent",
        )}
      >
        <Link href="/" className="flex min-h-12 items-center gap-2 no-underline" aria-label={t.nav.home}>
          <SigilLogo className="h-10 w-10" />
          <span className="font-display text-3xl font-black uppercase tracking-wide text-navy">Sigil</span>
        </Link>
        <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              className={cn(
                "rounded-[10px] px-3 py-2 text-[15px] font-bold text-navy no-underline hover:bg-cream-2",
                pathname.startsWith(href) && "bg-ember",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            className="btn btn-cream !min-h-12 !px-3 lg:!hidden"
            aria-expanded={open}
            aria-label={open ? n.close : n.menu}
            onClick={() => setOpen((o) => !o)}
            data-testid="menu"
          >
            <Icon name={open ? "cross" : "menu"} />
          </button>
        </div>
      </div>
      {open ? (
        <nav aria-label="Mobile" className="card mx-auto mt-2 grid max-w-[1280px] gap-1 p-3 lg:hidden">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="flex min-h-14 items-center rounded-[10px] px-3 text-lg font-bold text-navy no-underline hover:bg-cream-2">
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
