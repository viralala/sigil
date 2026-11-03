import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Big_Shoulders, Figtree, Space_Mono, Shrikhand } from "next/font/google";
import "./globals.css";
import { getDict, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { I18nProvider } from "@/components/site/i18n-provider";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { ServiceWorker } from "@/components/site/service-worker";

// Same families as the CESAC Fantastic 4 theme (cesac-app/src/app/layout.tsx). next/font self-hosts them,
// so a page load makes no request to Google.
// Fixed 800/900 weights (smaller than the variable opsz file). adjustFontFallback off: next/font has no
// fallback metrics for Big Shoulders and the build fails without it. display "optional": the preloaded face is
// used when it arrives in time, otherwise the fallback stays for that view, so headings never jump (CLS).
const display = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["800", "900"],
  adjustFontFallback: false,
  display: "optional",
});
const body = Figtree({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "700"] });
const mono = Space_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "700"] });
const script = Shrikhand({ variable: "--font-script", subsets: ["latin"], weight: ["400"], preload: false });

async function currentLocale(): Promise<Locale> {
  const v = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getDict(await currentLocale());
  return {
    title: t.meta.title,
    description: t.meta.description,
    manifest: "/manifest.webmanifest",
    icons: { icon: "/icon.svg", apple: "/icon-192.png" },
  };
}

export const viewport: Viewport = { themeColor: "#1F6FD1", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await currentLocale();
  const t = getDict(locale);
  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable} ${script.variable}`}>
      <body className="halftone flex min-h-dvh flex-col">
        <I18nProvider locale={locale} dict={t}>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 btn btn-cream">
            {t.nav.skip}
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
