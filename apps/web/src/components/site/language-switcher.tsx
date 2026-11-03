"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, LOCALE_COOKIE, LOCALE_NAMES, type Locale } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import { useI18n } from "./i18n-provider";

export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(l: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
  }

  return (
    <label className="flex items-center gap-2 font-semibold">
      <Icon name="globe" className="hidden text-xl min-[360px]:block" />
      <span className="sr-only">{t.nav.language}</span>
      <select
        data-testid="lang"
        className="field !min-h-12 !w-auto !py-2 !pl-3 pr-2"
        value={locale}
        aria-busy={pending || undefined}
        onChange={(e) => choose(e.target.value as Locale)}
      >
        {LOCALES.map((l) => (
          <option key={l} value={l} lang={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
