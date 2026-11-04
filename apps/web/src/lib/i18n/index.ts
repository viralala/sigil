import { en, type Dict as BaseDict } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import { siteEn, type SiteDict } from "./site.en";
import { siteHi } from "./site.hi";
import { siteMr } from "./site.mr";

export type Dict = BaseDict & { site: SiteDict };

export const LOCALES = ["en", "hi", "mr"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };
// BCP 47 tags for <html lang> and speech synthesis.
export const SPEECH_LANG: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };
export const LOCALE_COOKIE = "sigil-lang";

const DICTS: Record<Locale, Dict> = { en: { ...en, site: siteEn }, hi: { ...hi, site: siteHi }, mr: { ...mr, site: siteMr } };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

/** Fills {placeholders}. Unknown keys stay visible so a missing value is easy to spot in tests. */
export function fill(template: string, vars: Record<string, string | number | null | undefined>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (vars[k] == null ? m : String(vars[k])));
}

