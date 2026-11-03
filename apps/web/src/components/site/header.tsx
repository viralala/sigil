"use client";

import Link from "next/link";
import { useI18n } from "./i18n-provider";
import { LanguageSwitcher } from "./language-switcher";
import { SigilLogo } from "./sigil-logo";

export function SiteHeader() {
  const { t } = useI18n();
  return (
    <header className="wrap border-b-2 border-navy bg-cream">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 py-3">
        <Link href="/" className="flex min-h-12 items-center gap-2 no-underline" aria-label={t.nav.home}>
          <SigilLogo className="h-10 w-10" />
          <span className="font-display text-3xl font-black uppercase tracking-wide text-navy">Sigil</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
