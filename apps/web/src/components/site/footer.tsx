"use client";

import { useI18n } from "./i18n-provider";

// The CESAC mark appears here only as team branding (design/CESAC_REFERENCE.md).
export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="halftone-navy wrap mt-16 border-t-2 border-navy">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="cesac-mark text-3xl text-sky" aria-hidden />
          <div>
            <p className="m-0 font-bold">{t.footer.team}</p>
            <p className="m-0 text-sm text-sky-2">{t.footer.cesac}</p>
          </div>
        </div>
        <p className="label m-0 text-sky-2">{t.footer.honest}</p>
      </div>
    </footer>
  );
}
